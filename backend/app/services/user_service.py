"""NetShield AI - User Service."""

import logging
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, validate_password_complexity
from app.core.exceptions import NotFoundError, DuplicateError, ValidationError, AuthenticationError
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, UserProfileUpdate

logger = logging.getLogger("app")


class UserService:
    """Business logic for user management including soft-delete, password resets, role assignment, and sorting."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.role_repo = RoleRepository(session)
        self.audit_repo = AuditRepository(session)

    async def create_user(
        self, data: UserCreate, created_by: Optional[UUID] = None, ip_address: Optional[str] = None
    ) -> UserResponse:
        """Create a new user."""
        # Validate password
        errors = validate_password_complexity(data.password)
        if errors:
            raise ValidationError("Password does not meet requirements", [{"field": "password", "message": e} for e in errors])

        # Check duplicate email
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise DuplicateError("email")

        # Verify Role exists
        role = await self.role_repo.get_by_id(data.role_id)
        if not role:
            raise NotFoundError("Role", str(data.role_id))

        # Create user
        user = await self.user_repo.create({
            "email": data.email,
            "full_name": data.full_name,
            "hashed_password": hash_password(data.password),
            "phone": data.phone,
            "role_id": data.role_id,
            "team_id": data.team_id,
            "password_changed_at": datetime.now(timezone.utc),
            "is_active": True,
            "is_locked": False,
            "is_deleted": False,
        })

        user = await self.user_repo.get_by_id_with_relations(user.id)

        await self.audit_repo.create_log(
            user_id=created_by,
            action="create",
            resource="user",
            resource_id=str(user.id),
            new_values={"email": user.email, "full_name": user.full_name, "role": role.name},
            ip_address=ip_address,
        )

        return self._to_response(user)

    async def get_user(self, user_id: UUID) -> UserResponse:
        """Get user by ID."""
        user = await self.user_repo.get_by_id_with_relations(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))
        return self._to_response(user)

    async def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None,
        role_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[UserListResponse], int]:
        """List users with pagination, filters, and dynamic sorting."""
        skip = (page - 1) * per_page
        users, total = await self.user_repo.get_users_paginated(
            skip=skip,
            limit=per_page,
            search=search,
            role_id=role_id,
            team_id=team_id,
            is_active=is_active,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return [self._to_list_response(u) for u in users], total

    async def update_user(
        self, user_id: UUID, data: UserUpdate, updated_by: Optional[UUID] = None, ip_address: Optional[str] = None
    ) -> UserResponse:
        """Update user fields."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        old_email = user.email
        update_data = data.model_dump(exclude_unset=True)

        if "email" in update_data and update_data["email"] != old_email:
            existing = await self.user_repo.get_by_email(update_data["email"])
            if existing:
                raise DuplicateError("email")

        if "role_id" in update_data and update_data["role_id"]:
            role = await self.role_repo.get_by_id(update_data["role_id"])
            if not role:
                raise NotFoundError("Role", str(update_data["role_id"]))

        await self.user_repo.update(user_id, update_data)
        user = await self.user_repo.get_by_id_with_relations(user_id)

        await self.audit_repo.create_log(
            user_id=updated_by,
            action="update",
            resource="user",
            resource_id=str(user_id),
            old_values={"email": old_email},
            new_values=update_data,
            ip_address=ip_address,
        )

        return self._to_response(user)

    async def delete_user(
        self, user_id: UUID, deleted_by: Optional[UUID] = None, ip_address: Optional[str] = None
    ) -> None:
        """Hard delete user (DB record removal)."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        await self.audit_repo.create_log(
            user_id=deleted_by,
            action="hard_delete",
            resource="user",
            resource_id=str(user_id),
            old_values={"email": user.email, "full_name": user.full_name},
            ip_address=ip_address,
        )

        await self.user_repo.delete(user_id)

    async def soft_delete_user(
        self, user_id: UUID, deleted_by: Optional[UUID] = None, ip_address: Optional[str] = None
    ) -> None:
        """Soft delete user (update flags)."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        await self.user_repo.soft_delete(user_id)

        await self.audit_repo.create_log(
            user_id=deleted_by,
            action="soft_delete",
            resource="user",
            resource_id=str(user_id),
            old_values={"email": user.email, "is_deleted": False},
            new_values={"is_deleted": True},
            ip_address=ip_address,
        )

    async def activate_user(
        self, user_id: UUID, activated_by: Optional[UUID] = None, ip_address: Optional[str] = None
    ) -> UserResponse:
        """Activate user account."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        await self.user_repo.update(user_id, {"is_active": True})
        user = await self.user_repo.get_by_id_with_relations(user_id)

        await self.audit_repo.create_log(
            user_id=activated_by,
            action="activate",
            resource="user",
            resource_id=str(user_id),
            ip_address=ip_address,
        )
        return self._to_response(user)

    async def deactivate_user(
        self, user_id: UUID, deactivated_by: Optional[UUID] = None, ip_address: Optional[str] = None
    ) -> UserResponse:
        """Deactivate user account."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        await self.user_repo.update(user_id, {"is_active": False})
        user = await self.user_repo.get_by_id_with_relations(user_id)

        await self.audit_repo.create_log(
            user_id=deactivated_by,
            action="deactivate",
            resource="user",
            resource_id=str(user_id),
            ip_address=ip_address,
        )
        return self._to_response(user)

    async def update_profile(
        self, user_id: UUID, data: UserProfileUpdate, ip_address: Optional[str] = None
    ) -> UserResponse:
        """Update own profile."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        update_data = data.model_dump(exclude_unset=True)
        await self.user_repo.update(user_id, update_data)
        user = await self.user_repo.get_by_id_with_relations(user_id)
        return self._to_response(user)

    async def change_password(self, user_id: UUID, current_password: str, new_password: str) -> None:
        """Verify self password and update with complexity guidelines validation."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        if not verify_password(current_password, user.hashed_password):
            raise AuthenticationError("Invalid current password")

        errors = validate_password_complexity(new_password)
        if errors:
            raise ValidationError("Password does not meet requirements", [{"field": "new_password", "message": e} for e in errors])

        await self.user_repo.update(user_id, {
            "hashed_password": hash_password(new_password),
            "password_changed_at": datetime.now(timezone.utc)
        })

        await self.audit_repo.create_log(
            user_id=user_id,
            action="change_password",
            resource="user",
            resource_id=str(user_id),
        )

    async def reset_password(self, user_id: UUID, new_password: str, reset_by: Optional[UUID] = None, ip_address: Optional[str] = None) -> None:
        """Reset other user's password (Admin function)."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        errors = validate_password_complexity(new_password)
        if errors:
            raise ValidationError("Password does not meet requirements", [{"field": "new_password", "message": e} for e in errors])

        await self.user_repo.update(user_id, {
            "hashed_password": hash_password(new_password),
            "password_changed_at": datetime.now(timezone.utc)
        })

        await self.audit_repo.create_log(
            user_id=reset_by,
            action="reset_password",
            resource="user",
            resource_id=str(user_id),
            ip_address=ip_address,
        )

    async def assign_role(self, user_id: UUID, role_id: UUID, assigned_by: Optional[UUID] = None, ip_address: Optional[str] = None) -> UserResponse:
        """Assign role helper function to a user."""
        user = await self.user_repo.get_by_id_and_not_deleted(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))

        role = await self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role", str(role_id))

        await self.user_repo.update(user_id, {"role_id": role_id})
        user = await self.user_repo.get_by_id_with_relations(user_id)

        await self.audit_repo.create_log(
            user_id=assigned_by,
            action="assign_role",
            resource="user",
            resource_id=str(user_id),
            new_values={"role_id": str(role_id), "role_name": role.name},
            ip_address=ip_address,
        )
        return self._to_response(user)

    def _to_response(self, user) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            role_id=user.role_id,
            role_name=user.role.name if user.role else None,
            team_id=user.team_id,
            team_name=user.team.name if user.team else None,
            is_active=user.is_active,
            is_locked=user.is_locked,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def _to_list_response(self, user) -> UserListResponse:
        return UserListResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role_name=user.role.name if user.role else None,
            team_name=user.team.name if user.team else None,
            is_active=user.is_active,
            last_login=user.last_login,
            created_at=user.created_at,
        )
