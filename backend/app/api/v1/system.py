"""NetShield AI - System API Routes."""

from datetime import datetime, timezone
from fastapi import APIRouter

from app.schemas.system import HealthCheckResponse, ReadinessCheckResponse


router = APIRouter(tags=["System"])

_start_time = datetime.now(timezone.utc)


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint (no auth required)."""
    uptime = int((datetime.now(timezone.utc) - _start_time).total_seconds())
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        uptime_seconds=uptime,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/readiness", response_model=ReadinessCheckResponse)
async def readiness_check():
    """Readiness check for container orchestration."""
    checks = {}

    # Check PostgreSQL
    try:
        from app.core.database import async_engine
        from sqlalchemy import text
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["postgresql"] = {"status": "ok"}
    except Exception as e:
        checks["postgresql"] = {"status": "error", "detail": str(e)}

    # Check Redis
    try:
        from app.core.redis import redis_manager
        if redis_manager._client:
            await redis_manager._client.ping()
        checks["redis"] = {"status": "ok"}
    except Exception as e:
        checks["redis"] = {"status": "error", "detail": str(e)}

    # Check MongoDB
    try:
        from app.core.mongodb import mongodb_manager
        if mongodb_manager.client:
            await mongodb_manager.client.admin.command("ping")
        checks["mongodb"] = {"status": "ok"}
    except Exception as e:
        checks["mongodb"] = {"status": "error", "detail": str(e)}

    # Determine overall status
    all_ok = all(c.get("status") == "ok" for c in checks.values())

    return ReadinessCheckResponse(
        status="ready" if all_ok else "degraded",
        checks=checks,
        timestamp=datetime.now(timezone.utc),
    )
