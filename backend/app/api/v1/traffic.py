"""NetShield AI - Traffic API Routes."""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import require_roles
from app.core.mongodb import get_mongodb
from app.services.traffic_service import TrafficService
from app.schemas.traffic import TrafficLogResponse, TrafficStatsResponse, TrafficAnalyticsResponse, TrafficIngestRequest
from app.schemas.common import APIResponse, PaginatedResponse, MessageResponse

router = APIRouter(prefix="/traffic", tags=["Traffic"])


@router.get("", response_model=PaginatedResponse[TrafficLogResponse])
async def list_traffic(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    src_ip: Optional[str] = None,
    dst_ip: Optional[str] = None,
    protocol: Optional[str] = None,
    src_port: Optional[int] = None,
    dst_port: Optional[int] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    search: Optional[str] = None,
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """List traffic logs with filters and pagination."""
    service = TrafficService(mongodb)
    logs, total = await service.list_traffic(
        page, per_page, src_ip, dst_ip, protocol, src_port, dst_port, start_time, end_time, search,
    )
    return PaginatedResponse.create(logs, total, page, per_page)


@router.get("/stats", response_model=APIResponse[TrafficStatsResponse])
async def get_traffic_stats(
    hours: int = Query(24, ge=1, le=720),
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Get traffic statistics for the last N hours."""
    service = TrafficService(mongodb)
    stats = await service.get_stats(hours)
    return APIResponse(data=stats)


@router.get("/analytics", response_model=APIResponse[TrafficAnalyticsResponse])
async def get_traffic_analytics(
    hours: int = Query(24, ge=1, le=720),
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Get traffic analytics for chart visualizations."""
    service = TrafficService(mongodb)
    analytics = await service.get_analytics(hours)
    return APIResponse(data=analytics)


@router.post("/ingest", response_model=MessageResponse, status_code=202)
async def ingest_traffic(
    data: TrafficIngestRequest,
    mongodb: AsyncIOMotorDatabase = Depends(get_mongodb),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Ingest batch of traffic packets."""
    service = TrafficService(mongodb)
    count = await service.ingest_packets(data.packets)
    return MessageResponse(message=f"Ingested {count} packets")
