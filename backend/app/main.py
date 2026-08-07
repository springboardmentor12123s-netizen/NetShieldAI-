from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai
from app.database.database import engine, Base
from app.database import models

from app.routers import auth
from app.routers import users
from app.routers import teams
from app.routers import audit
from app.routers import traffic

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NetShield AI",
    version="1.0.0",
    description="AI Network Anomaly Detection & Threat Monitoring System"
)

# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3005",
        "http://127.0.0.1:3005",
        "http://localhost:3006",
        "http://127.0.0.1:3006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(audit.router)
app.include_router(traffic.router)
app.include_router(ai.router)
@app.get("/")
def root():
    return {"message": "Welcome to NetShield AI 🚀"}

@app.get("/health")
def health():
    return {"status": "Server is running"}