from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import joblib
import pandas as pd

from database import SessionLocal, User, Alert

app = FastAPI(
    title="NetShield AI",
    description="Network Anomaly Detection API",
    version="1.0"
)

# ---------- Allow the frontend (localhost:3000) to talk to this backend ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load the trained model ----------
model = joblib.load("../models/anomaly_model.pkl")
label_encoder = joblib.load("../models/label_encoder.pkl")

# ---------- Load a sample of the dataset for dashboard stats ----------
dataset_sample = pd.read_csv("../dataset/cicids2017_cleaned.csv").sample(n=50000, random_state=42)


# ---------- Basic setup for login ----------
SECRET_KEY = "netshield-super-secret-key-change-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Alerts are created for any prediction with risk_score >= this threshold
ALERT_RISK_THRESHOLD = 40

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_admin(current_user: dict = Depends(verify_token)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return current_user


def get_severity(risk_score: int) -> str:
    if risk_score >= 90:
        return "Critical"
    elif risk_score >= 70:
        return "High"
    elif risk_score >= 40:
        return "Medium"
    else:
        return "Low"


# ---------- Routes ----------

@app.get("/")
def home():
    return {"message": "NetShield AI Backend Running Successfully"}


@app.get("/health")
def health():
    return {"status": "ok"}


class SignupData(BaseModel):
    full_name: str
    username: str
    email: str | None = None
    password: str


@app.post("/signup")
def signup(data: SignupData, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = pwd_context.hash(data.password)
    new_user = User(
        full_name=data.full_name,
        username=data.username,
        email=data.email,
        hashed_password=hashed_password,
        role="analyst"
    )
    db.add(new_user)
    db.commit()

    return {"message": "Account created successfully! You can now log in."}


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token({"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}


class TrafficData(BaseModel):
    features: list[float]


@app.post("/predict")
def predict(data: TrafficData, current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    input_df = pd.DataFrame([data.features])
    prediction = model.predict(input_df)[0]
    label = label_encoder.inverse_transform([prediction])[0]

    probabilities = model.predict_proba(input_df)[0]
    confidence = float(probabilities[prediction])

    if label == "Normal Traffic":
        risk_score = round((1 - confidence) * 100)
    else:
        risk_score = round(confidence * 100)

    severity = get_severity(risk_score)

    # Automatically create an alert if risk is high enough
    if risk_score >= ALERT_RISK_THRESHOLD:
        new_alert = Alert(
            prediction=label,
            risk_score=risk_score,
            severity=severity,
            detected_by=current_user["username"],
            status="Open"
        )
        db.add(new_alert)
        db.commit()

    return {
        "prediction": label,
        "confidence": round(confidence * 100, 2),
        "risk_score": risk_score,
        "severity": severity,
        "checked_by": current_user["username"]
    }


@app.get("/stats")
def get_stats(current_user: dict = Depends(verify_token)):
    counts = dataset_sample["Attack Type"].value_counts().to_dict()
    total = int(sum(counts.values()))

    return {
        "total_records": total,
        "breakdown": counts
    }


@app.get("/admin/users")
def list_users(current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"username": u.username, "role": u.role} for u in users]


@app.get("/sample-traffic")
def get_sample_traffic(current_user: dict = Depends(verify_token)):
    import random

    data = dataset_sample.drop(columns=["Attack Type"])

    # Pick two different random real rows and blend them together with a
    # random weight. This creates realistic "borderline" traffic that sits
    # between two patterns, so the model produces a genuine spread of
    # confidence scores (low, medium, and high) instead of always being
    # extremely certain.
    row_a = data.sample(n=1).iloc[0]
    row_b = data.sample(n=1).iloc[0]
    weight = random.uniform(0.2, 0.8)

    blended = [
        (a * weight) + (b * (1 - weight))
        for a, b in zip(row_a.tolist(), row_b.tolist())
    ]

    # Add a bit of extra noise on top for realism
    noisy_features = [f * random.uniform(0.95, 1.05) for f in blended]

    return {"features": noisy_features}


@app.get("/alerts")
def list_alerts(current_user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "prediction": a.prediction,
            "risk_score": a.risk_score,
            "severity": a.severity,
            "detected_by": a.detected_by,
            "status": a.status,
            "created_at": a.created_at.isoformat()
        }
        for a in alerts
    ]


@app.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "Resolved"
    db.commit()

    return {"message": f"Alert {alert_id} marked as resolved."}