"""NetShield AI - Unit Tests for AuditService."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest
from uuid import uuid4

from app.services.audit_service import AuditService
from app.models.audit_log import AuditLog
from app.models.user import User


@pytest.mark.asyncio
async def test_list_logs_success(mock_db_session):
    """Test successful listing of audit logs with filters and pagination."""
    audit_service = AuditService(mock_db_session)
    audit_service.audit_repo = AsyncMock()

    user_id = uuid4()
    mock_user = User(id=user_id, email="audited_user@netshield.io", full_name="Audited User")

    mock_log = AuditLog(
        id=uuid4(),
        user_id=user_id,
        user=mock_user,
        action="update",
        resource="user",
        resource_id=str(user_id),
        old_values={"is_active": True},
        new_values={"is_active": False},
        ip_address="192.168.1.100",
        user_agent="Mozilla Browser",
        details="Deactivated own profile",
        created_at=datetime.now(timezone.utc),
    )

    audit_service.audit_repo.get_paginated.return_value = ([mock_log], 1)

    logs, total = await audit_service.list_logs(
        page=1,
        per_page=20,
        user_id=user_id,
        action="update",
        resource="user",
    )

    assert total == 1
    assert len(logs) == 1
    assert logs[0].action == "update"
    assert logs[0].user_email == "audited_user@netshield.io"
    assert logs[0].user_name == "Audited User"
    audit_service.audit_repo.get_paginated.assert_called_once()


@pytest.mark.asyncio
async def test_get_recent_activity_success(mock_db_session):
    """Test retrieving recent audit log activity."""
    audit_service = AuditService(mock_db_session)
    audit_service.audit_repo = AsyncMock()

    user_id = uuid4()
    mock_user = User(id=user_id, email="activity@netshield.io", full_name="Activity User")

    mock_log = AuditLog(
        id=uuid4(),
        user_id=user_id,
        user=mock_user,
        action="create",
        resource="role",
        resource_id=str(uuid4()),
        ip_address="10.0.0.5",
        details="Added Operator role",
        created_at=datetime.now(timezone.utc),
    )

    audit_service.audit_repo.get_recent_activity.return_value = [mock_log]

    result = await audit_service.get_recent_activity(limit=5)

    assert len(result) == 1
    assert result[0].action == "create"
    assert result[0].user_email == "activity@netshield.io"
    audit_service.audit_repo.get_recent_activity.assert_called_once_with(5)
