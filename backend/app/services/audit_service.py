"""NetShield AI - Audit Service."""

from typing import Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditLogResponse, AuditLogFilter


class AuditService:
    def __init__(self, session: AsyncSession):
        self.audit_repo = AuditRepository(session)

    async def list_logs(
        self, page: int = 1, per_page: int = 20,
        user_id: Optional[UUID] = None, action: Optional[str] = None,
        resource: Optional[str] = None, start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None, search: Optional[str] = None,
    ) -> tuple[List[AuditLogResponse], int]:
        skip = (page - 1) * per_page
        logs, total = await self.audit_repo.get_paginated(
            skip=skip, limit=per_page, user_id=user_id, action=action,
            resource=resource, start_date=start_date, end_date=end_date, search=search,
        )
        items = [
            AuditLogResponse(
                id=log.id, user_id=log.user_id,
                user_email=log.user.email if log.user else None,
                user_name=log.user.full_name if log.user else None,
                action=log.action, resource=log.resource,
                resource_id=log.resource_id, old_values=log.old_values,
                new_values=log.new_values, ip_address=log.ip_address,
                user_agent=log.user_agent, details=log.details,
                created_at=log.created_at,
            )
            for log in logs
        ]
        return items, total

    async def get_recent_activity(self, limit: int = 20) -> List[AuditLogResponse]:
        logs = await self.audit_repo.get_recent_activity(limit)
        return [
            AuditLogResponse(
                id=log.id, user_id=log.user_id,
                user_email=log.user.email if log.user else None,
                user_name=log.user.full_name if log.user else None,
                action=log.action, resource=log.resource,
                resource_id=log.resource_id, ip_address=log.ip_address,
                details=log.details, created_at=log.created_at,
            )
            for log in logs
        ]
