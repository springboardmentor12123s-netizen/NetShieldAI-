"""NetShield AI - Unit Tests for RoleService."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest
from uuid import uuid4

from app.core.exceptions import NotFoundError, DuplicateError, AuthorizationError
from app.services.role_service import RoleService
from app.models.role import Role
from app.models.permission import Permission, RolePermission
from app.schemas.role import RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate


@pytest.mark.asyncio
async def test_create_role_success(mock_db_session):
    """Test successful custom role creation."""
    role_service = RoleService(mock_db_session)
    role_service.role_repo = AsyncMock()
    role_service.audit_repo = AsyncMock()

    role_id = uuid4()
    mock_role = Role(
        id=role_id,
        name="Security Analyst",
        description="Analyzes security logs",
        is_system_role=False,
        created_at=datetime.now(timezone.utc),
    )
    role_service.role_repo.get_by_name.return_value = None
    role_service.role_repo.create.return_value = mock_role
    role_service.role_repo.get_with_permissions.return_value = mock_role

    create_data = RoleCreate(
        name="Security Analyst",
        description="Analyzes security logs",
        permission_ids=[uuid4()],
    )

    result = await role_service.create_role(create_data, created_by=uuid4(), ip="127.0.0.1")

    assert result.name == "Security Analyst"
    assert result.is_system_role is False
    role_service.role_repo.create.assert_called_once()
    role_service.role_repo.set_permissions.assert_called_once()
    role_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_create_role_duplicate_name(mock_db_session):
    """Test role creation raises DuplicateError on name conflict."""
    role_service = RoleService(mock_db_session)
    role_service.role_repo = AsyncMock()

    role_service.role_repo.get_by_name.return_value = Role(id=uuid4(), name="DuplicatedRole")

    create_data = RoleCreate(name="DuplicatedRole")
    with pytest.raises(DuplicateError):
        await role_service.create_role(create_data)


@pytest.mark.asyncio
async def test_delete_role_system_role_fails(mock_db_session):
    """Test system roles cannot be deleted."""
    role_service = RoleService(mock_db_session)
    role_service.role_repo = AsyncMock()

    system_role_id = uuid4()
    mock_role = Role(id=system_role_id, name="admin", is_system_role=True)
    role_service.role_repo.get_by_id.return_value = mock_role

    with pytest.raises(AuthorizationError) as exc_info:
        await role_service.delete_role(system_role_id)
    assert "Cannot delete system-defined roles" in str(exc_info.value)


@pytest.mark.asyncio
async def test_delete_role_with_assigned_users_fails(mock_db_session):
    """Test custom roles currently assigned to users cannot be deleted."""
    role_service = RoleService(mock_db_session)
    role_service.role_repo = AsyncMock()

    role_id = uuid4()
    mock_role = Role(id=role_id, name="Operator", is_system_role=False)
    role_service.role_repo.get_by_id.return_value = mock_role

    # Simulate get_all_with_user_count returning 3 users assigned to this role
    role_service.role_repo.get_all_with_user_count.return_value = [
        {"role": mock_role, "user_count": 3}
    ]

    with pytest.raises(AuthorizationError) as exc_info:
        await role_service.delete_role(role_id)
    assert "still assigned" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_permission_success(mock_db_session):
    """Test successful permission creation."""
    role_service = RoleService(mock_db_session)
    role_service.permission_repo = AsyncMock()
    role_service.audit_repo = AsyncMock()

    perm_id = uuid4()
    mock_perm = Permission(
        id=perm_id,
        name="Update Traffic Logs",
        resource="traffic",
        action="update",
        description="Allow traffic modifies",
    )
    role_service.permission_repo.get_all.return_value = []
    role_service.permission_repo.create.return_value = mock_perm

    create_data = PermissionCreate(
        name="Update Traffic Logs",
        resource="traffic",
        action="update",
        description="Allow traffic modifies",
    )

    result = await role_service.create_permission(create_data, created_by=uuid4())

    assert result.resource == "traffic"
    assert result.action == "update"
    role_service.permission_repo.create.assert_called_once()
    role_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_create_permission_duplicate_fails(mock_db_session):
    """Test database unique constraint on duplicate resource/action pairs."""
    role_service = RoleService(mock_db_session)
    role_service.permission_repo = AsyncMock()

    mock_perm = Permission(id=uuid4(), name="Existing", resource="user", action="create")
    role_service.permission_repo.get_all.return_value = [mock_perm]

    create_data = PermissionCreate(name="New User Create", resource="user", action="create")

    with pytest.raises(DuplicateError):
        await role_service.create_permission(create_data)


@pytest.mark.asyncio
async def test_assign_permissions(mock_db_session):
    """Test batch permissions allocation to custom user roles."""
    role_service = RoleService(mock_db_session)
    role_service.role_repo = AsyncMock()
    role_service.permission_repo = AsyncMock()
    role_service.audit_repo = AsyncMock()

    role_id = uuid4()
    perm_id = uuid4()
    mock_role = Role(id=role_id, name="Analyst", is_system_role=False, created_at=datetime.now(timezone.utc))
    mock_perm = Permission(id=perm_id, name="Read", resource="threats", action="read")

    role_service.role_repo.get_by_id.return_value = mock_role
    role_service.permission_repo.get_by_id.return_value = mock_perm
    role_service.role_repo.get_with_permissions.return_value = mock_role

    await role_service.assign_permissions(role_id, [perm_id], operator_id=uuid4())

    role_service.role_repo.add_permissions.assert_called_once_with(role_id, [perm_id])
    role_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_get_role_permission_matrix(mock_db_session):
    """Test RBAC role-permission matrix extraction format."""
    role_service = RoleService(mock_db_session)
    role_service.role_repo = AsyncMock()

    role_service.role_repo.get_role_permission_matrix.return_value = [
        {"role_id": uuid4(), "role_name": "Admin", "permissions": ["user:create", "user:delete"]},
        {"role_id": uuid4(), "role_name": "Operator", "permissions": ["user:create"]},
    ]

    result = await role_service.get_role_permission_matrix()

    assert len(result) == 2
    assert result[0].role_name == "Admin"
    assert "user:delete" in result[0].permissions
