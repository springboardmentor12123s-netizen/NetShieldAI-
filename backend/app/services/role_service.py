"""NetShield AI - Role & Permission Service."""

from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, DuplicateError, AuthorizationError
from app.repositories.role_repository import RoleRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleListResponse,
    PermissionResponse,
    PermissionCreate,
    PermissionUpdate,
    RolePermissionMatrixEntry,
)


class RoleService:
    """Business logic for role and permission management including system restrictions."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.role_repo = RoleRepository(session)
        self.permission_repo = PermissionRepository(session)
        self.audit_repo = AuditRepository(session)

    # --- Role CRUD Operations ---

    async def create_role(
        self, data: RoleCreate, created_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> RoleResponse:
        """Create a new custom user role."""
        existing = await self.role_repo.get_by_name(data.name)
        if existing:
            raise DuplicateError("role name")

        role = await self.role_repo.create({
            "name": data.name,
            "description": data.description,
            "is_system_role": False,
        })

        if data.permission_ids:
            await self.role_repo.set_permissions(role.id, data.permission_ids)

        await self.audit_repo.create_log(
            user_id=created_by,
            action="create",
            resource="role",
            resource_id=str(role.id),
            new_values={"name": role.name, "permission_ids": [str(pid) for pid in data.permission_ids]},
            ip_address=ip,
        )

        return await self.get_role(role.id)

    async def get_role(self, role_id: UUID) -> RoleResponse:
        """Fetch role by ID containing all its nested permissions."""
        role = await self.role_repo.get_with_permissions(role_id)
        if not role:
            raise NotFoundError("Role", str(role_id))

        permissions = [
            PermissionResponse(
                id=rp.permission.id,
                name=rp.permission.name,
                resource=rp.permission.resource,
                action=rp.permission.action,
                description=rp.permission.description,
            )
            for rp in role.role_permissions
            if rp.permission
        ]

        return RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            is_system_role=role.is_system_role,
            permissions=permissions,
            created_at=role.created_at,
        )

    async def list_roles(self) -> List[RoleListResponse]:
        """List all system roles mapping user counts."""
        rows = await self.role_repo.get_all_with_user_count()
        return [
            RoleListResponse(
                id=r["role"].id,
                name=r["role"].name,
                description=r["role"].description,
                is_system_role=r["role"].is_system_role,
                user_count=r["user_count"],
                created_at=r["role"].created_at,
            )
            for r in rows
        ]

    async def update_role(
        self, role_id: UUID, data: RoleUpdate, updated_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> RoleResponse:
        """Update role meta info and optionally replace its permissions."""
        role = await self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role", str(role_id))

        if role.is_system_role:
            raise AuthorizationError("Cannot modify system-defined roles")

        update_data = data.model_dump(exclude_unset=True, exclude={"permission_ids"})
        if "name" in update_data and update_data["name"] != role.name:
            existing = await self.role_repo.get_by_name(update_data["name"])
            if existing:
                raise DuplicateError("role name")

        if update_data:
            await self.role_repo.update(role_id, update_data)

        if data.permission_ids is not None:
            await self.role_repo.set_permissions(role_id, data.permission_ids)

        await self.audit_repo.create_log(
            user_id=updated_by,
            action="update",
            resource="role",
            resource_id=str(role_id),
            new_values=data.model_dump(exclude_unset=True),
            ip_address=ip,
        )

        return await self.get_role(role_id)

    async def delete_role(
        self, role_id: UUID, deleted_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> None:
        """Delete role (with system roles safeguard)."""
        role = await self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role", str(role_id))

        if role.is_system_role:
            raise AuthorizationError("Cannot delete system-defined roles")

        # Verify no users are assigned to this role prior to delete
        rows = await self.role_repo.get_all_with_user_count()
        for r in rows:
            if r["role"].id == role_id and r["user_count"] > 0:
                raise AuthorizationError(f"Cannot delete role: {r['user_count']} users still assigned")

        await self.audit_repo.create_log(
            user_id=deleted_by,
            action="delete",
            resource="role",
            resource_id=str(role_id),
            old_values={"name": role.name},
            ip_address=ip,
        )

        await self.role_repo.delete(role_id)

    # --- Permission CRUD Operations ---

    async def create_permission(
        self, data: PermissionCreate, created_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> PermissionResponse:
        """Create a new resource permission."""
        # Check by resource and action unique constraint
        all_perms = await self.permission_repo.get_all()
        for p in all_perms:
            if p.resource == data.resource and p.action == data.action:
                raise DuplicateError("Resource action pair")

        perm = await self.permission_repo.create(data.model_dump())

        await self.audit_repo.create_log(
            user_id=created_by,
            action="create",
            resource="permission",
            resource_id=str(perm.id),
            new_values=data.model_dump(),
            ip_address=ip,
        )

        return PermissionResponse.model_validate(perm)

    async def get_permission(self, perm_id: UUID) -> PermissionResponse:
        """Get permission detail."""
        perm = await self.permission_repo.get_by_id(perm_id)
        if not perm:
            raise NotFoundError("Permission", str(perm_id))
        return PermissionResponse.model_validate(perm)

    async def update_permission(
        self, perm_id: UUID, data: PermissionUpdate, updated_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> PermissionResponse:
        """Update permission info."""
        perm = await self.permission_repo.get_by_id(perm_id)
        if not perm:
            raise NotFoundError("Permission", str(perm_id))

        update_data = data.model_dump(exclude_unset=True)
        if "resource" in update_data or "action" in update_data:
            res = update_data.get("resource", perm.resource)
            act = update_data.get("action", perm.action)
            all_perms = await self.permission_repo.get_all()
            for p in all_perms:
                if p.id != perm_id and p.resource == res and p.action == act:
                    raise DuplicateError("Resource action pair")

        await self.permission_repo.update(perm_id, update_data)
        perm = await self.permission_repo.get_by_id(perm_id)

        await self.audit_repo.create_log(
            user_id=updated_by,
            action="update",
            resource="permission",
            resource_id=str(perm_id),
            new_values=update_data,
            ip_address=ip,
        )

        return PermissionResponse.model_validate(perm)

    async def delete_permission(
        self, perm_id: UUID, deleted_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> None:
        """Delete permission."""
        perm = await self.permission_repo.get_by_id(perm_id)
        if not perm:
            raise NotFoundError("Permission", str(perm_id))

        await self.audit_repo.create_log(
            user_id=deleted_by,
            action="delete",
            resource="permission",
            resource_id=str(perm_id),
            old_values={"name": perm.name, "resource": perm.resource, "action": perm.action},
            ip_address=ip,
        )

        await self.permission_repo.delete(perm_id)

    # --- Role Permission Assignment & Matrix Operations ---

    async def assign_permissions(
        self, role_id: UUID, permission_ids: List[UUID], operator_id: Optional[UUID] = None, ip: Optional[str] = None
    ) -> RoleResponse:
        """Assign specific permissions to a role (without purging existing permissions)."""
        role = await self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role", str(role_id))

        if role.is_system_role:
            raise AuthorizationError("Cannot modify system roles")

        # Verify permissions exist
        for pid in permission_ids:
            p = await self.permission_repo.get_by_id(pid)
            if not p:
                raise NotFoundError("Permission", str(pid))

        await self.role_repo.add_permissions(role_id, permission_ids)

        await self.audit_repo.create_log(
            user_id=operator_id,
            action="assign_permissions",
            resource="role",
            resource_id=str(role_id),
            new_values={"added_permissions": [str(pid) for pid in permission_ids]},
            ip_address=ip,
        )

        return await self.get_role(role_id)

    async def remove_permissions(
        self, role_id: UUID, permission_ids: List[UUID], operator_id: Optional[UUID] = None, ip: Optional[str] = None
    ) -> RoleResponse:
        """Remove specific permissions from a role."""
        role = await self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role", str(role_id))

        if role.is_system_role:
            raise AuthorizationError("Cannot modify system roles")

        await self.role_repo.remove_permissions(role_id, permission_ids)

        await self.audit_repo.create_log(
            user_id=operator_id,
            action="remove_permissions",
            resource="role",
            resource_id=str(role_id),
            new_values={"removed_permissions": [str(pid) for pid in permission_ids]},
            ip_address=ip,
        )

        return await self.get_role(role_id)

    async def get_all_permissions(self) -> List[PermissionResponse]:
        """Get all system permissions."""
        perms = await self.role_repo.get_all_permissions()
        return [
            PermissionResponse(
                id=p.id,
                name=p.name,
                resource=p.resource,
                action=p.action,
                description=p.description,
            )
            for p in perms
        ]

    async def get_role_permission_matrix(self) -> List[RolePermissionMatrixEntry]:
        """Fetch full RBAC role-permission assignment mapping matrix."""
        matrix = await self.role_repo.get_role_permission_matrix()
        return [
            RolePermissionMatrixEntry(
                role_id=entry["role_id"],
                role_name=entry["role_name"],
                permissions=entry["permissions"],
            )
            for entry in matrix
        ]
