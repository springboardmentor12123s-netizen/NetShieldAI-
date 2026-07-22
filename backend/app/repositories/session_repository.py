"""NetShield AI - Session Repository."""

from typing import Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import Session
from app.models.refresh_token import RefreshToken
from app.repositories.base_repository import BaseRepository


class SessionRepository(BaseRepository[Session]):
    """Repository for Session model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(Session, session)

    async def get_by_token_hash(self, token_hash: str) -> Optional[Session]:
        """Find session by token hash."""
        result = await self.session.execute(
            select(Session).where(Session.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        """Revoke all sessions for a user."""
        await self.session.execute(
            update(Session)
            .where(Session.user_id == user_id, Session.is_revoked == False)
            .values(is_revoked=True)
        )
        await self.session.flush()


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for RefreshToken model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(RefreshToken, session)

    async def get_by_token_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Find refresh token by hash."""
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_by_family(self, family_id: str) -> None:
        """Revoke all tokens in a family (theft detection)."""
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id)
            .values(is_revoked=True)
        )
        await self.session.flush()

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        """Revoke all refresh tokens for a user."""
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
            .values(is_revoked=True)
        )
        await self.session.flush()

    async def cleanup_expired(self) -> int:
        """Delete expired refresh tokens. Returns count deleted."""
        from sqlalchemy import delete as sql_delete
        result = await self.session.execute(
            sql_delete(RefreshToken).where(
                RefreshToken.expires_at < datetime.now(timezone.utc)
            )
        )
        await self.session.flush()
        return result.rowcount
