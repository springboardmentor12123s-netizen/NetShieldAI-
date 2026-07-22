"""NetShield AI - Dashboard Service."""

import psutil
import time
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.user_repository import UserRepository
from app.repositories.audit_repository import AuditRepository
from app.repositories.traffic_repository import TrafficRepository
from app.schemas.dashboard import DashboardStats, SystemHealthResponse, RecentActivityItem, DashboardRecentActivity

START_TIME = time.time()


class DashboardService:
    def __init__(self, session: AsyncSession, mongodb: AsyncIOMotorDatabase):
        self.session = session
        self.user_repo = UserRepository(session)
        self.audit_repo = AuditRepository(session)
        self.traffic_repo = TrafficRepository(mongodb)

    async def get_stats(self) -> DashboardStats:
        active_users = await self.user_repo.count_active_users()
        total_traffic = await self.traffic_repo.get_total_count()
        stats = await self.traffic_repo.get_stats(hours=24)

        return DashboardStats(
            total_traffic=total_traffic,
            today_alerts=0,
            risk_score=0.0,
            active_users=active_users,
            total_packets=stats.get("total_packets", 0) if isinstance(stats, dict) else stats.total_packets,
            bandwidth_mbps=stats.get("bandwidth_mbps", 0.0) if isinstance(stats, dict) else stats.bandwidth_mbps,
            connected_devices=stats.get("unique_sources", 0) if isinstance(stats, dict) else stats.unique_sources,
            packet_rate=stats.get("packets_per_second", 0.0) if isinstance(stats, dict) else stats.packets_per_second,
            top_protocols=[],
            top_attacked_ports=[],
        )

    async def get_system_health(self) -> SystemHealthResponse:
        return SystemHealthResponse(
            cpu_usage=psutil.cpu_percent(interval=0.1),
            memory_usage=psutil.virtual_memory().percent,
            disk_usage=psutil.disk_usage("/").percent,
            uptime_seconds=int(time.time() - START_TIME),
        )

    async def get_recent_activity(self, limit: int = 20) -> DashboardRecentActivity:
        logs = await self.audit_repo.get_recent_activity(limit)
        activities = [
            RecentActivityItem(
                id=str(log.id),
                type=log.action,
                description=log.details or f"{log.action} on {log.resource}",
                user=log.user.full_name if log.user else None,
                timestamp=log.created_at,
            )
            for log in logs
        ]
        return DashboardRecentActivity(activities=activities, total=len(activities))
