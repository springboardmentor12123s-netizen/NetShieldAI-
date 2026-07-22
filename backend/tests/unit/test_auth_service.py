"""NetShield AI - Unit Tests for Authentication Service."""

from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
import pytest

from app.core.exceptions import AuthenticationError, AccountLockedError
from app.services.auth_service import AuthService
from app.models.user import User
from app.models.role import Role
from app.core.security import hash_password


@pytest.mark.asyncio
async def test_authenticate_user_success(mock_db_session):
    """Test successful user credentials authentication."""
    # Mock repositories
    auth_service = AuthService(mock_db_session)
    auth_service.user_repo = AsyncMock()

    # Base mock user
    mock_role = Role(name="Analyst")
    password = "AnalystPassword123!"
    mock_user = User(
        email="analyst@netshield.io",
        full_name="NetShield Analyst",
        hashed_password=hash_password(password),
        is_active=True,
        is_locked=False,
        failed_login_attempts=0,
        role=mock_role,
        role_id=mock_role.id,
    )

    auth_service.user_repo.get_by_email.return_value = mock_user

    auth_service.user_repo.reset_failed_attempts = AsyncMock()
    auth_service.role_repo = AsyncMock()
    auth_service.session_repo = AsyncMock()
    auth_service.refresh_repo = AsyncMock()
    auth_service.audit_repo = AsyncMock()

    # Mock token creation requirements
    auth_service.role_repo.get_permissions_for_role.return_value = ["traffic:read"]
    auth_service.session_repo.create.return_value = MagicMock()
    auth_service.refresh_repo.create.return_value = MagicMock()
    auth_service.audit_repo.create_log.return_value = MagicMock()

    result = await auth_service.login(
        email="analyst@netshield.io", password=password, ip_address="127.0.0.1", user_agent="Pytest"
    )

    assert result.user.email == "analyst@netshield.io"
    assert result.access_token is not None
    assert result.refresh_token is not None


@pytest.mark.asyncio
async def test_authenticate_user_locked(mock_db_session):
    """Test login attempt on locked accounts raises appropriate error."""
    auth_service = AuthService(mock_db_session)
    auth_service.user_repo = AsyncMock()

    mock_user = User(
        email="locked-user@netshield.io",
        is_active=True,
        is_locked=True,
        locked_until=datetime.now(timezone.utc) + timedelta(minutes=30),
        failed_login_attempts=5,
    )
    auth_service.user_repo.get_by_email.return_value = mock_user

    with pytest.raises(AccountLockedError) as exc:
        await auth_service.login(
            email="locked-user@netshield.io", password="AnalystPassword123!", ip_address="127.0.0.1", user_agent="Pytest"
        )

    assert "locked" in str(exc.value).lower()
