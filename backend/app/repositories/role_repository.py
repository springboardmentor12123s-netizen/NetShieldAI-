"""NetShield AI - Role Repository."""

from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Role
from app.models.permission import Permission, RolePermission
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class RoleRepository(BaseRepository[Role]):
    """Repository for Role model operations including association updates."""

    def __init__(self, session: AsyncSession):
        super().__init__(Role, session)

    async def get_by_name(self, name: str) -> Optional[Role]:
        """Find role by name."""
        result = await self.session.execute(
            select(Role).where(Role.name == name)
        )
        return result.scalar_one_or_none()

    async def get_with_permissions(self, role_id: UUID) -> Optional[Role]:
        """Get role with its permissions loaded."""
        result = await self.session.execute(
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
            .where(Role.id == role_id)
        )
        return result.scalar_one_or_none()

    async def get_all_with_user_count(self) -> List[dict]:
        """Get all roles with user counts."""
        result = await self.session.execute(
            select(
                Role,
                func.count(User.id).label("user_count"),
            )
            .outerjoin(User, User.role_id == Role.id)
            .group_by(Role.id)
            .order_by(Role.name)
        )
        rows = result.all()
        return [{"role": row[0], "user_count": row[1]} for row in rows]

    async def set_permissions(self, role_id: UUID, permission_ids: List[UUID]) -> None:
        """Replace all permissions for a role."""
        # Remove existing
        existing = await self.session.execute(
            select(RolePermission).where(RolePermission.role_id == role_id)
        )
        for rp in existing.scalars().all():
            await self.session.delete(rp)

        # Add new
        for pid in permission_ids:
            rp = RolePermission(role_id=role_id, permission_id=pid)
            self.session.add(rp)

        await self.session.flush()

    async def add_permissions(self, role_id: UUID, permission_ids: List[UUID]) -> None:
        """Add specific permissions (without removing others)."""
        for pid in permission_ids:
            # Avoid duplicate inserts
            stmt = select(RolePermission).where(
                and_(RolePermission.role_id == role_id, RolePermission.permission_id == pid)
            )
            exists = (await self.session.execute(stmt)).scalar_one_or_none()
            if not exists:
                rp = RolePermission(role_id=role_id, permission_id=pid)
                self.session.add(rp)
        await self.session.flush()

    async def remove_permissions(self, role_id: UUID, permission_ids: List[UUID]) -> None:
        """Remove specific permissions from a role."""
        for pid in permission_ids:
            stmt = select(RolePermission).where(
                and_(RolePermission.role_id == role_id, RolePermission.permission_id == pid)
            )
            obj = (await self.session.execute(stmt)).scalar_one_or_none()
            if obj:
                await self.session.delete(obj)
        await self.session.flush()

    async def get_permissions_for_role(self, role_id: UUID) -> List[str]:
        """Get permission strings for a role."""
        result = await self.session.execute(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        )
        permissions = result.scalars().all()
        return [f"{p.resource}:{p.action}" for p in permissions]

    async def get_all_permissions(self) -> List[Permission]:
        """Get all system permissions."""
        result = await self.session.execute(select(Permission).order_by(Permission.resource, Permission.action))
        return list(result.scalars().all())

    async def get_role_permission_matrix(self) -> List[dict]:
        """Fetch matrix showing mapping of all roles to their permission strings."""
        result = await self.session.execute(
            select(Role).options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
        )
        roles = result.scalars().all()
        matrix = []
        for r in roles:
            perms = [f"{rp.permission.resource}:{rp.permission.action}" for rp in r.role_permissions if rp.permission]
            matrix.append({
                "role_id": r.id,
                "role_name": r.name,
                "permissions": perms,
            })
        return matrix
