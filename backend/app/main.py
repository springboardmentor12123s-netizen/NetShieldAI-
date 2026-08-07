
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  (ensures models are registered on Base metadata)

from app.routers import auth, users, traffic, anomaly, alerts, dashboard, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Network Anomaly Detection & Threat Monitoring Platform API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(traffic.router)
app.include_router(anomaly.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.app_name}