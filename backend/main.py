import os
import sys
import logging
import secrets
from typing import List
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from bson import ObjectId
from passlib.context import CryptContext
# from models import Incident, User, AuditLog

import smtplib
import ssl
from email.message import EmailMessage
from jose import jwt, JWTError

# from models import Base  # Import your SQLAlchemy Base from your models file
from database import engine  # Import your database engine connected to Supabase


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# --- Path Fix ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- Internal Imports ---
from database import get_mongo_db
from database.postgres import get_db, engine, Base, User, SessionLocal
# from auth import router as auth_router
from threat_ops import build_dashboard_snapshot, classify_threat

# ==========================================
# 1. APPLICATION & DATABASE SETUP
# ==========================================

# Initialize FastAPI App
app = FastAPI(
    title="NetShield AI SOC API",
    description="Backend API for the NetShield Cybersecurity Dashboard"
)

# Configure CORS for Frontend Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include external routers
# app.include_router(auth_router)

# Setup Logging
logger = logging.getLogger("netshield-threatops")

# Auto-generate PostgreSQL tables on startup
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified successfully on Supabase PostgreSQL.")
except Exception as exc:
    logger.warning("Database tables could not be created at startup: %s", exc)

# Initialize MongoDB connection (with in-memory fallback)
mongo_db = get_mongo_db()
collection = mongo_db["network_traffic_stats"] if mongo_db is not None else None

# In-memory fallbacks for environments without MongoDB
SAMPLE_PACKETS: List[dict] = [
    {"Label": "DDoS", "Source IP": "198.51.100.87", "Destination IP": "203.0.113.10", "Destination Port": 80, "Flow Duration": 1800, "Total Fwd Packets": 64, "status": "Active", "timestamp": datetime.utcnow().isoformat()},
    {"Label": "PortScan", "Source IP": "198.51.100.44", "Destination IP": "203.0.113.10", "Destination Port": 22, "Flow Duration": 420, "Total Fwd Packets": 12, "status": "Investigating", "timestamp": (datetime.utcnow() - timedelta(minutes=1)).isoformat()},
    {"Label": "BENIGN", "Source IP": "10.0.0.15", "Destination IP": "203.0.113.10", "Destination Port": 443, "Flow Duration": 540, "Total Fwd Packets": 4, "status": "Resolved", "timestamp": (datetime.utcnow() - timedelta(minutes=2)).isoformat()},
]
IN_MEMORY_ALERTS = [
    {
        "id": "fallback-1",
        "incident_id": "fallback-1",
        "incident": "Detected DDoS",
        "severity": "CRITICAL",
        "risk_score": 95,
        "source": "198.51.100.87",
        "destination": "203.0.113.10:80",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "Active",
    },
    {
        "id": "fallback-2",
        "incident_id": "fallback-2",
        "incident": "Detected PortScan",
        "severity": "MEDIUM",
        "risk_score": 60,
        "source": "198.51.100.44",
        "destination": "203.0.113.10:22",
        "timestamp": (datetime.utcnow() - timedelta(minutes=1)).isoformat(),
        "status": "Investigating",
    },
]

# ==========================================
# 2. PYDANTIC DATA SCHEMAS
# ==========================================
# These models define the exact structure of data expected from the frontend
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully in Supabase.")
    except Exception as exc:
        logger.warning("Database startup warning: %s", exc)

class IncidentUpdate(BaseModel):
    status: str  # 'Investigating', 'Isolated', 'Resolved'
    assigned_to: str = "System"
    
class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str

class UserUpdate(BaseModel):
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class IsolateRequest(BaseModel):
    incident_id: str
    source_ip: str



# ==========================================
# 3. AUTH & USER MANAGEMENT ENDPOINTS (PostgreSQL)
# ==========================================

@app.post("/api/auth/signup")
def signup_user(user: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user in the PostgreSQL database."""
    try:
        normalized_email = user.email.strip().lower()
        existing_user = db.execute(
            text("SELECT id FROM users WHERE email = :e"), {"e": normalized_email}
        ).fetchone()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        db.execute(
            text("INSERT INTO users (email, hashed_password, is_active) VALUES (:e, :p, :a)"),
            {"e": normalized_email, "p": pwd_context.hash(user.password), "a": True}
        )
        db.commit()
        return {"status": "success", "message": f"User {normalized_email} created."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates a user and writes to the audit log."""
    normalized_email = req.username.strip().lower()
    user = db.execute(
        text("SELECT id, email, hashed_password, is_active FROM users WHERE email = :e"),
        {"e": normalized_email}
    ).fetchone()

    # Handle Invalid Login
    if not user or not user[3] or not pwd_context.verify(req.password, user[2]):
        db.execute(
            text("INSERT INTO audit_logs (username, event, severity) VALUES (:u, :e, :s)"),
            {"u": req.username, "e": "Failed login attempt (Invalid credentials)", "s": "Critical"}
        )
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Handle Successful Login
    db.execute(
        text("INSERT INTO audit_logs (username, event, severity) VALUES (:u, :e, :s)"),
        {"u": user[1], "e": "User login successful", "s": "Info"}
    )
    db.commit()
    return {"status": "success", "message": "Login successful", "username": user[1], "role": "Security Analyst"}

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a time-limited JWT reset token and email a reset link to the user (if the account exists).
    Always returns a success message to avoid account enumeration.
    """
    normalized_email = req.email.strip().lower()
    user = db.execute(
        text("SELECT id, email FROM users WHERE email = :e"),
        {"e": normalized_email}
    ).fetchone()

    # If user exists, create token and attempt to send email.
    if user:
        SECRET_KEY = os.getenv("SECRET_KEY", "netshield-key")
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
        try:
            expire = datetime.utcnow() + timedelta(hours=1)
            token = jwt.encode({"sub": normalized_email, "exp": expire}, SECRET_KEY, algorithm="HS256")

            smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", 587))
            smtp_email = os.getenv("SMTP_EMAIL")
            smtp_password = os.getenv("SMTP_APP_PASSWORD")

            reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

            msg = EmailMessage()
            msg["Subject"] = "NetShield — Password reset instructions"
            msg["From"] = smtp_email or "no-reply@netshield.local"
            msg["To"] = normalized_email
            msg.set_content(f"To reset your NetShield password, visit: {reset_link}\nIf you did not request this, ignore this email.")
            msg.add_alternative(
                f"""
                <html>
                  <body>
                    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                    <p><a href=\"{reset_link}\">Reset your password</a></p>
                    <p>If you did not request this change, ignore this email.</p>
                  </body>
                </html>
                """,
                subtype="html",
            )

            context = ssl.create_default_context()
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls(context=context)
                server.login(smtp_email, smtp_password)
                server.send_message(msg)

            db.execute(
                text("INSERT INTO audit_logs (username, event, severity) VALUES (:u, :e, :s)"),
                {
                    "u": normalized_email,
                    "e": "Password reset requested (email sent)",
                    "s": "Info",
                },
            )
            db.commit()
        except Exception as e:
            logging.error(f"Failed to send reset email to {normalized_email}: {e}")

    # Always return this message to avoid revealing whether the email exists.
    return {"status": "success", "message": "If an account exists for that email, reset instructions have been sent."}


@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Accepts a token and new_password. Validates the token and updates password if the account exists."""
    SECRET_KEY = os.getenv("SECRET_KEY", "netshield-key")
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Update the password if user exists. Still return success if not, to avoid enumeration.
    user = db.execute(
        text("SELECT id, email FROM users WHERE email = :e"),
        {"e": email},
    ).fetchone()

    if not user:
        return {"status": "success", "message": "Password has been reset if the account exists."}

    new_hashed = pwd_context.hash(req.new_password)
    db.execute(text("UPDATE users SET hashed_password = :p WHERE email = :e"), {"p": new_hashed, "e": email})
    db.execute(
        text("INSERT INTO audit_logs (username, event, severity) VALUES (:u, :e, :s)"),
        {"u": email, "e": "Password reset completed", "s": "Info"},
    )
    db.commit()

    return {"status": "success", "message": "Password has been reset."}

@app.get("/api/users")
def get_team_members(db: Session = Depends(get_db)):
    """Fetches all registered team members."""
    try:
        result = db.execute(text("SELECT id, email, is_active FROM users")).fetchall()
        users_list = [
            {
                "id": row[0],
                "name": row[1],
                "email": row[1],
                "role": "Security Analyst",
                "status": "Active" if row[2] else "Inactive"
            }
            for row in result
        ]
        if not users_list and str(engine.url).startswith("sqlite"):
            users_list.append({
                "id": 1,
                "name": "admin@netshield.com",
                "email": "admin@netshield.com",
                "role": "Administrator",
                "status": "Active",
            })
        return {"data": users_list}
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return {"data": [{
            "id": 1,
            "name": "admin@netshield.com",
            "email": "admin@netshield.com",
            "role": "Administrator",
            "status": "Active",
        }]}

@app.put("/api/users/{user_id}")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Updates an existing user's Role-Based Access permissions."""
    try:
        db.execute(
            text("UPDATE users SET role = :r WHERE id = :id"),
            {"r": user_update.role, "id": user_id}
        )
        db.commit()
        return {"status": "success", "message": f"User {user_id} updated."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    """Fetches the 10 most recent system audit logs."""
    try:
        logs = db.execute(text("SELECT id, timestamp, username, event, severity FROM audit_logs ORDER BY timestamp DESC LIMIT 10")).fetchall()
        log_list = [
            {
                "id": log[0],
                "time": log[1].strftime("%Y-%m-%d %H:%M:%S") if log[1] else "Unknown",
                "user": log[2],
                "event": log[3],
                "severity": log[4]
            }
            for log in logs
        ]
        return {"data": log_list}
    except Exception as e:
        logger.error(f"Error fetching logs: {e}")
        return {"data": []}


# ==========================================
# 4. THREAT INTELLIGENCE & NETWORK ENDPOINTS (MongoDB)
# ==========================================

def calculate_risk_metrics(label, dest_port):
    """Calculates a Risk Score (0-100) and Severity Level."""
    label_str = str(label).upper()
    if "DDOS" in label_str or "INFILTRATION" in label_str:
        return 95, "CRITICAL"
    elif "DOS" in label_str or "BOT" in label_str:
        return 80, "HIGH"
    elif "PORT" in label_str or "SCAN" in label_str:
        return 60, "MEDIUM"
    elif label_str not in ["BENIGN", "0"]:
        return 75, "HIGH"
    return 10, "LOW"

@app.get("/api/alerts")
async def get_live_alerts():
    """Generates real-time alerts directly from MongoDB."""
    alerts_list = []
    if collection is not None:
        try:
            raw_threats = list(collection.find(
                {"Label": {"$nin": ["BENIGN", "0", 0]}}
            ).sort("_id", -1).limit(50))

            for threat in raw_threats:
                label = threat.get("Label", "Anomalous Traffic")
                dest_port = threat.get("Destination Port", 0)
                risk_score, severity = calculate_risk_metrics(label, dest_port)
                alerts_list.append({
                    "id": str(threat["_id"]),
                    "incident_id": str(threat["_id"]),
                    "incident": f"Detected {label}",
                    "severity": severity,
                    "risk_score": risk_score,
                    "source": threat.get("Source IP", "192.168.1.50"),
                    "destination": f"{threat.get('Destination IP', '10.0.0.1')}:{dest_port}",
                    "timestamp": threat.get("timestamp", "Just now"),
                    "status": threat.get("status", "Active")
                })
            if alerts_list:
                return {"data": alerts_list, "count": len(alerts_list)}
        except Exception as e:
            logger.warning(f"Error fetching MongoDB alerts: {e}")

    if not alerts_list:
        alerts_list = list(IN_MEMORY_ALERTS)
    return {"data": alerts_list, "count": len(alerts_list)}
@app.get("/api/incidents")
async def get_incidents():
    """Groups current alerts by source IP into incidents."""
    alerts_response = await get_live_alerts()
    alerts = alerts_response["data"]

    grouped: dict = {}
    for a in alerts:
        key = a["source"]
        if key not in grouped:
            grouped[key] = {
                "id": f"INC-{len(grouped) + 1}",
                "source_ip": key,
                "alert_count": 0,
                "highest_severity": "LOW",
                "alerts": [],
            }
        grouped[key]["alert_count"] += 1
        grouped[key]["alerts"].append(a["id"])
        severity_rank = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        if severity_rank.get(a["severity"], 0) > severity_rank.get(grouped[key]["highest_severity"], 0):
            grouped[key]["highest_severity"] = a["severity"]

    return {"data": list(grouped.values()), "count": len(grouped)}

@app.put("/api/incidents/{incident_id}")
def update_incident_status(incident_id: str, update: IncidentUpdate):
    """Updates the packet status directly in MongoDB so the UI instantly syncs."""
    if mongo_db is None:
        raise HTTPException(status_code=500, detail="MongoDB not connected")
        
    try:
        # Locates the exact packet in MongoDB using its _id and updates the status
        result = mongo_db.network_traffic_stats.update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {
                "status": update.status,
                "assigned_to": update.assigned_to
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Incident not found in MongoDB.")
            
        return {"status": "success", "message": f"Incident {incident_id} updated to {update.status}."}
        
    except Exception as e:
        print(f"Error isolating host in MongoDB: {e}")

@app.post("/api/incidents")
def create_incident(req: IsolateRequest, db: Session = Depends(get_db)):
    """Creates a new incident ticket when a critical threat is detected."""
    try:
        new_incident = Incident(
            incident_id=req.incident_id,
            source_ip=req.source_ip,
            status="New"
        )
        db.add(new_incident)
        
        # Log this creation in the audit log
        db.execute(
            text("INSERT INTO audit_logs (username, event, severity) VALUES ('System', :e, 'Warning')"),
            {"e": f"Incident {req.incident_id} automatically created for IP {req.source_ip}"}
        )
        db.commit()
        return {"status": "success", "message": f"Incident {req.incident_id} logged."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



    
@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Deletes a user from the PostgreSQL database."""
    try:
        db.execute(
            text("DELETE FROM users WHERE id = :id"),
            {"id": user_id}
        )
        db.commit()
        return {"status": "success", "message": f"User {user_id} deleted successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/isolate")
async def isolate_host(req: IsolateRequest):
    """Simulates an OS-level firewall command to isolate a malicious IP."""
    logger.info(f"🛡️ ACTION TAKEN: Isolating malicious host {req.source_ip} (Incident: {req.incident_id})")
    return {
        "status": "success", 
        "message": f"Host {req.source_ip} has been successfully isolated from the network."
    }

@app.get("/api/traffic-stats")
async def get_traffic_stats() -> dict:
    """Retrieves recent network packets and generates dashboard statistics."""
    if collection is not None:
        docs = list(collection.find().sort([("_id", -1)]).limit(200))
        packets = []
        for d in docs:
            d2 = {k: v for k, v in d.items() if k != "_id"}
            d2["id"] = str(d.get("_id"))
            packets.append(d2)
        if packets:
            snapshot = build_dashboard_snapshot(packets)
            return {"data": packets, "snapshot": snapshot}

    packets = SAMPLE_PACKETS
    snapshot = build_dashboard_snapshot(packets)
    return {"data": packets, "snapshot": snapshot}

@app.post("/api/live-traffic")
async def receive_live_traffic(request: Request) -> dict:
    """Ingests live packets from the network sniffer."""
    packet_batch = await request.json()
    inserted = 0
    if packet_batch:
        if collection is not None:
            try:
                collection.insert_many(packet_batch)
                inserted = len(packet_batch)
            except Exception:
                SAMPLE_PACKETS.extend(packet_batch)
                inserted = len(packet_batch)
        else:
            SAMPLE_PACKETS.extend(packet_batch)
            if len(SAMPLE_PACKETS) > 200:
                SAMPLE_PACKETS[:] = SAMPLE_PACKETS[-200:]
            inserted = len(packet_batch)

    return {"status": "success", "inserted": inserted}

@app.get("/api/reports")
async def get_reports():
    """Generates dashboard stats using live counts from MongoDB."""
    total_packets = len(SAMPLE_PACKETS)
    isolated_count = sum(1 for packet in SAMPLE_PACKETS if str(packet.get("status", "")).lower() == "isolated")

    if collection is not None:
        try:
            total_packets = collection.count_documents({"Label": {"$nin": ["BENIGN", "0", 0]}})
            isolated_count = collection.count_documents({"status": "Isolated"})
        except Exception as e:
            logger.warning(f"Error counting MongoDB stats: {e}")

    return {
        "data": {
            "summary": {
                "total_packets": total_packets,
                "database_incidents_tracked": total_packets,
                "hosts_actively_isolated": isolated_count,
            },
            "recommendations": [
                "Isolate high-risk source IPs and review affected services.",
                "Escalate DDoS and intrusion indicators to the SOC lead.",
                "Capture additional telemetry for TTL and packet-rate anomalies.",
            ],
        }
    }

@app.get("/health")
async def health() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}