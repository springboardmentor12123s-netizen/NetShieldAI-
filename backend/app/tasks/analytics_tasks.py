"""NetShield AI - Periodic Analytics Aggregation Background Tasks."""

import asyncio
import json
import logging

from app.tasks.celery_app import celery_app
from app.core.mongodb import MongoDBManager
from app.core.redis import RedisManager
from app.repositories.traffic_repository import TrafficRepository

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
def compute_analytics() -> str:
    """Consolidate high-volume traffic records and broadcast metrics updates to UI clients via Redis."""
    async def _compute():
        await MongoDBManager.connect()
        await RedisManager.connect()
        try:
            db = MongoDBManager.get_database()
            repo = TrafficRepository(db)

            # Retrieve telemetry aggregations for the past 24 hours
            stats = await repo.get_stats(hours=24)
            analytics = await repo.get_analytics(hours=24)

            # Assemble real-time stats update bundle
            payload = {
                "event": "dashboard_stats_update",
                "stats": stats,
                "analytics": analytics,
            }

            # Ship to Redis dashboard channel
            redis_client = RedisManager.get_client()
            await redis_client.publish("dashboard", json.dumps(payload))

            msg = "Consolidated dashboard analytics and published update payload."
            logger.info(msg)
            return msg
        finally:
            await RedisManager.disconnect()
            await MongoDBManager.disconnect()

    try:
        return run_async(_compute())
    except Exception as e:
        err_msg = f"Failed task compute_analytics: {e}"
        logger.error(err_msg)
        return err_msg
