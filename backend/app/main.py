import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import Base, engine
from app.routers import auth, datasets, ml, monitoring

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
for folder in ("uploads", "predictions", "saved_models"):
    (BASE_DIR / folder).mkdir(parents=True, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NetShield AI API",
    description="Local network anomaly detection and monitoring API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(ml.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
# Root aliases preserve the endpoint contract specified for the college project.
app.include_router(auth.router, include_in_schema=False)
app.include_router(datasets.router, include_in_schema=False)
app.include_router(ml.router, include_in_schema=False)
app.include_router(monitoring.router, include_in_schema=False)


@app.get("/")
def root():
    return {"name": "NetShield AI", "status": "online", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
