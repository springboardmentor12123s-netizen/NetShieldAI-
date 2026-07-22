"""NetShield AI - Dashboard API Routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
from app.core.mongodb import get_mongodb
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardStats, SystemHealthResponse, DashboardRecentActivity
from app.schemas.common import APIResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=APIResponse[DashboardStats])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(get_current_user),
):
    """Get dashboard statistics."""
    service = DashboardService(db, mongodb)
    stats = await service.get_stats()
    return APIResponse(data=stats)


@router.get("/health", response_model=APIResponse[SystemHealthResponse])
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(get_current_user),
):
    """Get system health metrics."""
    service = DashboardService(db, mongodb)
    health = await service.get_system_health()
    return APIResponse(data=health)


@router.get("/activity", response_model=APIResponse[DashboardRecentActivity])
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(get_current_user),
):
    """Get recent activity feed."""
    service = DashboardService(db, mongodb)
    activity = await service.get_recent_activity(limit)
    return APIResponse(data=activity)
