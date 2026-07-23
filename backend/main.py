import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .models import User
from .auth import router as auth_router
from .routes import router as routes_router
import bcrypt

# Initialize SQL Database Tables
Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    try:
        # Check if users exist
        if db.query(User).count() == 0:
            default_users = [
                ("admin", "admin@netshield.ai", "admin123", "Admin"),
                ("analyst", "analyst@netshield.ai", "analyst123", "Analyst"),
                ("auditor", "auditor@netshield.ai", "auditor123", "Auditor")
            ]
            for username, email, pwd, role in default_users:
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw(pwd.encode('utf-8'), salt).decode('utf-8')
                user = User(username=username, email=email, password_hash=hashed, role=role)
                db.add(user)
            db.commit()
            print("Successfully pre-seeded default role-based users.")
    except Exception as e:
        print(f"Error seeding users: {e}")
    finally:
        db.close()


app = FastAPI(
    title="NetShield AI",
    description="Network Anomaly Detection & Threat Monitoring System Backend",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    seed_users()


# Enable CORS for the local frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local file system or other dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount APIRouters
app.include_router(auth_router)
app.include_router(routes_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "NetShield AI",
        "description": "Network Anomaly Detection Engine REST API"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
