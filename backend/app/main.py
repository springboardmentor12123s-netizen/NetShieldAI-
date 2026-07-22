"""NetShield AI - FastAPI Application Factory."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import close_db
from app.core.mongodb import MongoDBManager
from app.core.redis import RedisManager
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging

from app.middleware.rate_limiter import RateLimitMiddleware
from app.middleware.request_logger import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

from app.api.v1 import api_v1_router
from app.websocket.endpoints import router as ws_router
from app.websocket.connection_manager import manager

settings = get_settings()
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.APP_ENV})")

    # Connect to databases
    try:
        await RedisManager.connect()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis not available (non-critical): {e}")

    try:
        await MongoDBManager.connect()
        logger.info("MongoDB connected")
    except Exception as e:
        logger.warning(f"MongoDB not available (non-critical): {e}")

    # Auto-create tables for SQLite dev mode
    from app.core.database import init_db
    await init_db()
    logger.info("Database tables initialized")

    logger.info(f"{settings.APP_NAME} is ready")

    yield

    # Shutdown
    logger.info("Shutting down...")
    await manager.stop_all_listeners()
    logger.info("WebSocket listeners stopped")
    try:
        await RedisManager.disconnect()
    except Exception:
        pass
    try:
        await MongoDBManager.disconnect()
    except Exception:
        pass
    await close_db()
    logger.info("All connections closed")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-powered Network Anomaly Detection & Threat Monitoring System",
        version=settings.APP_VERSION,
        docs_url="/api/docs" if settings.APP_DEBUG else None,
        redoc_url="/api/redoc" if settings.APP_DEBUG else None,
        openapi_url="/api/openapi.json" if settings.APP_DEBUG else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # Custom middleware (applied bottom-to-top)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)


    # Exception handlers
    register_exception_handlers(app)

    # Routes
    app.include_router(api_v1_router)
    app.include_router(ws_router)

    return app


# Module-level app instance for uvicorn
app = create_app()
