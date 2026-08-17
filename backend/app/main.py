from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

from app.models.user import User
from app.models.network_packet import NetworkPacket
from app.models.anomaly import Anomaly
from app.models.ai_dataset import AIDataset

from app.routes.auth import router as auth_router
from app.routes.network import router as network_router
from app.routes.anomaly import router as anomaly_router
from app.routes.analytics import router as analytics_router
from app.routes.websocket import router as websocket_router
from app.routes.report import router as report_router
from app.routes.email import router as email_router

app = FastAPI(
    title="NetShield AI"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:4173",
    "http://localhost:8080",
    "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(network_router)
app.include_router(anomaly_router)
app.include_router(analytics_router)
app.include_router(websocket_router)
app.include_router(report_router)
app.include_router(email_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to NetShield AI"
    }