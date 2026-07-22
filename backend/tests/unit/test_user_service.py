"""NetShield AI - Unit Tests for UserService."""

from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock
import pytest
from uuid import uuid4

from app.core.exceptions import NotFoundError, DuplicateError, ValidationError, AuthenticationError
from app.services.user_service import UserService
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate, UserProfileUpdate


@pytest.mark.asyncio
async def test_create_user_success(mock_db_session):
    """Test successful user creation including complexity checks."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()
    user_service.role_repo = AsyncMock()
    user_service.audit_repo = AsyncMock()

    # Setup Mocks
    role_id = uuid4()
    mock_role = Role(id=role_id, name="Operator")
    user_service.role_repo.get_by_id.return_value = mock_role
    user_service.user_repo.get_by_email.return_value = None

    mock_user = User(
        id=uuid4(),
        email="operator@netshield.io",
        full_name="NetShield Operator",
        role_id=role_id,
        role=mock_role,
        is_active=True,
        is_locked=False,
        is_deleted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    user_service.user_repo.create.return_value = mock_user
    user_service.user_repo.get_by_id_with_relations.return_value = mock_user

    create_data = UserCreate(
        email="operator@netshield.io",
        full_name="NetShield Operator",
        password="SuperPass123!_Long",
        role_id=role_id,
    )

    result = await user_service.create_user(create_data, created_by=uuid4(), ip_address="127.0.0.1")

    assert result.email == "operator@netshield.io"
    assert result.role_name == "Operator"
    user_service.user_repo.create.assert_called_once()
    user_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_create_user_duplicate_email(mock_db_session):
    """Test user creation raises DuplicateError on email collision."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()
    user_service.role_repo = AsyncMock()

    role_id = uuid4()
    mock_role = Role(id=role_id, name="Operator")
    user_service.role_repo.get_by_id.return_value = mock_role
    user_service.user_repo.get_by_email.return_value = User(
        id=uuid4(),
        email="dup@netshield.io",
        full_name="NetShield Duplicate",
        is_active=True,
        is_locked=False,
        is_deleted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    create_data = UserCreate(
        email="dup@netshield.io",
        full_name="NetShield Duplicate",
        password="SuperPass123!_Long",
        role_id=role_id,
    )

    with pytest.raises(DuplicateError):
        await user_service.create_user(create_data)


@pytest.mark.asyncio
async def test_soft_delete_user(mock_db_session):
    """Test soft-delete updates database flags instead of dropping rows."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()
    user_service.audit_repo = AsyncMock()

    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="delete_me@netshield.io",
        full_name="NetShield SoftDelete",
        is_active=True,
        is_locked=False,
        is_deleted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user_service.user_repo.get_by_id_and_not_deleted.return_value = mock_user

    await user_service.soft_delete_user(user_id, deleted_by=uuid4(), ip_address="127.0.0.1")

    user_service.user_repo.soft_delete.assert_called_once_with(user_id)
    user_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_activate_and_deactivate_user(mock_db_session):
    """Test activation and deactivation flow of user accounts."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()
    user_service.role_repo = AsyncMock()
    user_service.audit_repo = AsyncMock()

    role_id = uuid4()
    mock_role = Role(id=role_id, name="Operator")

    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="status@netshield.io",
        full_name="NetShield StatusChanger",
        is_active=True,
        is_locked=False,
        is_deleted=False,
        role_id=role_id,
        role=mock_role,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user_service.user_repo.get_by_id_and_not_deleted.return_value = mock_user
    user_service.user_repo.get_by_id_with_relations.return_value = mock_user

    # Test Deactivate
    result_deact = await user_service.deactivate_user(user_id, deactivated_by=uuid4())
    user_service.user_repo.update.assert_called_with(user_id, {"is_active": False})

    # Test Activate
    result_act = await user_service.activate_user(user_id, activated_by=uuid4())
    user_service.user_repo.update.assert_called_with(user_id, {"is_active": True})


@pytest.mark.asyncio
async def test_change_password_success(mock_db_session):
    """Test user can change password verifying current credential matching."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()
    user_service.audit_repo = AsyncMock()

    from app.core.security import hash_password
    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="pass_change@netshield.io",
        full_name="NetShield PassChange",
        hashed_password=hash_password("OldPassword123!"),
        is_active=True,
        is_locked=False,
        is_deleted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user_service.user_repo.get_by_id_and_not_deleted.return_value = mock_user

    await user_service.change_password(
        user_id=user_id,
        current_password="OldPassword123!",
        new_password="NewVerifiedPassword123!",
    )

    user_service.user_repo.update.assert_called_once()
    user_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_reset_password_complexity_failure(mock_db_session):
    """Test admin password resets check password requirements."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()

    user_id = uuid4()
    mock_user = User(
        id=user_id,
        email="complexity@netshield.io",
        full_name="NetShield Complexity",
        is_active=True,
        is_locked=False,
        is_deleted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    user_service.user_repo.get_by_id_and_not_deleted.return_value = mock_user

    # Too short path
    with pytest.raises(ValidationError):
        await user_service.reset_password(user_id, "short")


@pytest.mark.asyncio
async def test_assign_role_success(mock_db_session):
    """Test admin role assignments."""
    user_service = UserService(mock_db_session)
    user_service.user_repo = AsyncMock()
    user_service.role_repo = AsyncMock()
    user_service.audit_repo = AsyncMock()

    user_id = uuid4()
    role_id = uuid4()
    mock_role = Role(id=role_id, name="Admin")
    mock_user = User(
        id=user_id,
        email="role@netshield.io",
        full_name="NetShield RoleChanger",
        is_active=True,
        is_locked=False,
        is_deleted=False,
        role_id=role_id,
        role=mock_role,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    user_service.user_repo.get_by_id_and_not_deleted.return_value = mock_user
    user_service.role_repo.get_by_id.return_value = mock_role
    user_service.user_repo.get_by_id_with_relations.return_value = mock_user

    await user_service.assign_role(user_id, role_id, assigned_by=uuid4())

    user_service.user_repo.update.assert_called_with(user_id, {"role_id": role_id})
    user_service.audit_repo.create_log.assert_called_once()
