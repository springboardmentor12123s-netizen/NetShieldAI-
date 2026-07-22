"""NetShield AI - User Repository."""

from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations including soft-deletes and sorting."""

    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_id_and_not_deleted(self, id: UUID) -> Optional[User]:
        """Fetch active user by primary key (not soft deleted)."""
        result = await self.session.execute(
            select(User).where(User.id == id, User.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Find non-deleted user by email address."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email, User.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_id_with_relations(self, user_id: UUID) -> Optional[User]:
        """Get user with role and team loaded (not soft deleted)."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.role), selectinload(User.team))
            .where(User.id == user_id, User.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_users_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[User], int]:
        """Get paginated users with filters, search, and dynamic sorting."""
        query = select(User).options(selectinload(User.role), selectinload(User.team)).where(User.is_deleted == False)
        count_query = select(User).where(User.is_deleted == False)

        if search:
            search_filter = or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        if role_id:
            query = query.where(User.role_id == role_id)
            count_query = count_query.where(User.role_id == role_id)

        if team_id:
            query = query.where(User.team_id == team_id)
            count_query = count_query.where(User.team_id == team_id)

        if is_active is not None:
            query = query.where(User.is_active == is_active)
            count_query = count_query.where(User.is_active == is_active)

        # Count total matching records
        total_result = await self.session.execute(
            select(func.count()).select_from(count_query.subquery())
        )
        total = total_result.scalar_one()

        # Dynamic Sorting
        sort_attr = getattr(User, sort_by, None)
        if not sort_attr or sort_by in ("hashed_password", "is_deleted", "deleted_at"):
            sort_attr = User.created_at

        if sort_order.lower() == "asc":
            query = query.order_by(sort_attr.asc())
        else:
            query = query.order_by(sort_attr.desc())

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def soft_delete(self, user_id: UUID) -> bool:
        """Flags is_deleted flag as true instead of removing row."""
        user = await self.get_by_id_and_not_deleted(user_id)
        if not user:
            return False
        user.is_active = False
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        await self.session.flush()
        return True

    async def increment_failed_attempts(self, user_id: UUID) -> None:
        """Increment failed login attempts."""
        user = await self.get_by_id_and_not_deleted(user_id)
        if user:
            user.failed_login_attempts += 1
            await self.session.flush()

    async def reset_failed_attempts(self, user_id: UUID) -> None:
        """Reset failed login attempts to zero."""
        user = await self.get_by_id_and_not_deleted(user_id)
        if user:
            user.failed_login_attempts = 0
            user.is_locked = False
            user.locked_until = None
            await self.session.flush()

    async def count_active_users(self) -> int:
        """Count active users."""
        result = await self.session.execute(
            select(func.count(User.id)).where(User.is_active == True, User.is_deleted == False)
        )
        return result.scalar_one()
