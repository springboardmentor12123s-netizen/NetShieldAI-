"""NetShield AI - Audit Repository."""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    """Repository for AuditLog model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(AuditLog, session)

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[UUID] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs with filters."""
        query = select(AuditLog).options(selectinload(AuditLog.user))
        count_query = select(func.count()).select_from(AuditLog)

        if user_id:
            query = query.where(AuditLog.user_id == user_id)
            count_query = count_query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)
        if resource:
            query = query.where(AuditLog.resource == resource)
            count_query = count_query.where(AuditLog.resource == resource)
        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
            count_query = count_query.where(AuditLog.created_at >= start_date)
        if end_date:
            query = query.where(AuditLog.created_at <= end_date)
            count_query = count_query.where(AuditLog.created_at <= end_date)
        if search:
            search_filter = or_(
                AuditLog.action.ilike(f"%{search}%"),
                AuditLog.resource.ilike(f"%{search}%"),
                AuditLog.details.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        logs = list(result.scalars().all())

        return logs, total

    async def create_log(
        self,
        user_id: Optional[UUID],
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry."""
        return await self.create({
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "old_values": old_values,
            "new_values": new_values,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details,
        })

    async def get_recent_activity(self, limit: int = 20) -> List[AuditLog]:
        """Get recent audit log entries."""
        result = await self.session.execute(
            select(AuditLog)
            .options(selectinload(AuditLog.user))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
