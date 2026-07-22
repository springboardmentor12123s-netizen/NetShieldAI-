"""NetShield AI - Permission Repository."""

from app.models.permission import Permission
from app.repositories.base_repository import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession


class PermissionRepository(BaseRepository[Permission]):
    """Repository for Permission model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(Permission, session)
