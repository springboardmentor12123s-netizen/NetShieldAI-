"""
NetShield AI — FastAPI application entry point.

Bootstraps the database, creates required directories, configures CORS,
and registers all API routers.
"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import Base, engine
from app.routers import auth, datasets, ml, monitoring, reports, live, incidents
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Ensure runtime directories exist before the first request arrives.
for folder in ("uploads", "predictions", "saved_models"):
    (BASE_DIR / folder).mkdir(parents=True, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NetShield AI API",
    description="Local network anomaly detection and monitoring API",
    version="2.0.0",
)

# Determine CORS origins from environment, defaulting to localhost for local dev.
cors_origins = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prefixed routes exposed in the OpenAPI schema.
app.include_router(auth.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(ml.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(live.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
# Unprefixed aliases preserve the legacy endpoint contract.
app.include_router(auth.router, include_in_schema=False)
app.include_router(datasets.router, include_in_schema=False)
app.include_router(ml.router, include_in_schema=False)
app.include_router(monitoring.router, include_in_schema=False)
app.include_router(reports.router, include_in_schema=False)
app.include_router(live.router, include_in_schema=False)
app.include_router(incidents.router, include_in_schema=False)


@app.on_event("shutdown")
def shutdown_event():
    import logging
    logger = logging.getLogger("netshield.main")
    logger.info("Initiating graceful shutdown of background services...")

    try:
        from app.services.capture_service import capture_service
        capture_service.stop_capture()
        logger.info("Capture service stopped.")
    except Exception as e:
        logger.error(f"Error stopping capture service: {e}")

    try:
        from app.services.flow_builder import flow_builder
        flow_builder.stop()
        logger.info("Flow builder stopped.")
    except Exception as e:
        logger.error(f"Error stopping flow builder: {e}")

    try:
        from app.services.feature_extractor import feature_extractor
        feature_extractor.stop()
        logger.info("Feature extractor stopped.")
    except Exception as e:
        logger.error(f"Error stopping feature extractor: {e}")

    try:
        from app.services.live_predictor import live_predictor
        live_predictor.stop()
        logger.info("Live predictor stopped.")
    except Exception as e:
        logger.error(f"Error stopping live predictor: {e}")


@app.get("/")
def root():
    return {"name": "NetShield AI", "status": "online", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
