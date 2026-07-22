"""NetShield AI - Database Cleanup Background Tasks."""

import asyncio
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import delete

from app.tasks.celery_app import celery_app
from app.core.database import async_session_factory
from app.core.mongodb import MongoDBManager
from app.models.session import Session
from app.models.refresh_token import RefreshToken

logger = logging.getLogger("app")


def run_async(coro):
    """Run an async coroutine synchronously inside Celery worker."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task
def cleanup_expired_sessions() -> str:
    """Audit & discard expired user sessions and revoked refresh tokens from Postgres."""
    async def _cleanup():
        now = datetime.now(timezone.utc)
        async with async_session_factory() as session:
            # Drop expired/revoked sessions
            stmt_sessions = delete(Session).where(
                (Session.expires_at < now) | (Session.is_revoked == True)
            )
            res_sessions = await session.execute(stmt_sessions)

            # Drop expired/revoked refresh tokens
            stmt_tokens = delete(RefreshToken).where(
                (RefreshToken.expires_at < now) | (RefreshToken.is_revoked == True)
            )
            res_tokens = await session.execute(stmt_tokens)

            await session.commit()
            msg = (
                f"Completed PostgreSQL cleanups: dropped {res_sessions.rowcount} expired sessions "
                f"and {res_tokens.rowcount} invalid refresh tokens."
            )
            logger.info(msg)
            return msg

    try:
        return run_async(_cleanup())
    except Exception as e:
        err_msg = f"Failed task cleanup_expired_sessions: {e}"
        logger.error(err_msg)
        return err_msg


@celery_app.task
def cleanup_old_traffic(retention_days: int = 30) -> str:
    """Enforce data retention logic on high-volume MongoDB traffic document collection."""
    async def _cleanup_mongo():
        # Open client session
        await MongoDBManager.connect()
        try:
            db = MongoDBManager.get_database()
            collection = db["traffic_logs"]

            cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
            res = await collection.delete_many({"timestamp": {"$lt": cutoff}})

            msg = f"MongoDB cleanup: removed {res.deleted_count} traffic documents older than {retention_days} days."
            logger.info(msg)
            return msg
        finally:
            await MongoDBManager.disconnect()

    try:
        return run_async(_cleanup_mongo())
    except Exception as e:
        err_msg = f"Failed task cleanup_old_traffic: {e}"
        logger.error(err_msg)
        return err_msg
