from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import check_connection, init_indexes
from app.ml.capture import engine as capture_engine
from app.routers import (
    alerts_router,
    analytics_router,
    auth_router,
    dashboard_router,
    monitoring_router,
    packets_router,
    predict_router,
    reports_router,
    settings_router,
    training_router,
    users_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_indexes()
    yield
    capture_engine.stop()


app = FastAPI(title="NetShield AI", version="1.1.0", lifespan=lifespan)

# Allow only the configured frontend origin(s) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(dashboard_router.router)
app.include_router(predict_router.router)
app.include_router(alerts_router.router)
app.include_router(analytics_router.router)
app.include_router(packets_router.router)
app.include_router(reports_router.router)
app.include_router(settings_router.router)
app.include_router(monitoring_router.router)
app.include_router(training_router.router)


@app.get("/health")
async def health():
    return {"status": "ok", "mongo_connected": await check_connection()}


@app.get("/")
async def root():
    return {"message": "NetShield AI backend is running. See /docs for the API."}
