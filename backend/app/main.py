from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine
from app.database.models import Base

from app.routers.auth_router import router as auth_router
from app.routers.dataset_router import router as dataset_router
from app.routers.dashboard_router import router as dashboard_router

from app.routers import traffic
from app.routers import analytics
from app.routers import alerts
from app.routers import reports

from app.services.packet_capture import run_packet_capture

from app.routers import prediction


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="NetShield AI API",
    description="Backend API for NetShield AI",
    version="1.0.0"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)


app.include_router(
    dataset_router,
    prefix="/dataset",
    tags=["Dataset"]
)


app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)


app.include_router(
    traffic.router,
    prefix="/traffic",
    tags=["Traffic"]
)


app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)


app.include_router(
    alerts.router,
    prefix="/alerts",
    tags=["Alerts"]
)


app.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"]
)


app.include_router(
    prediction.router,
    prefix="/predict",
    tags=["Prediction"]
)

@app.on_event("startup")
def startup_event():
    print("Starting Live Packet Capture...")
    run_packet_capture()


@app.get("/")
def home():
    return {
        "message": "NetShield AI Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy"
    }