"""NetShield AI - High-Volume Traffic Ingestion Background Tasks."""

import asyncio
import json
import logging
from typing import List, Dict, Any

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
def process_packet_batch(packets: List[Dict[str, Any]]) -> str:
    """Ingest a batch of packet logs into MongoDB and announce web updates via Redis Pub/Sub."""
    async def _ingest():
        await MongoDBManager.connect()
        await RedisManager.connect()
        try:
            db = MongoDBManager.get_database()
            repo = TrafficRepository(db)

            # High volume bulk insertion
            count = await repo.insert_batch(packets)

            # Publish payload to Redis "traffic" pub/sub channel for WebSocket broadcast
            redis_client = RedisManager.get_client()
            pub_payload = {
                "event": "new_traffic_batch",
                "count": count,
                "data": packets,
            }
            await redis_client.publish("traffic", json.dumps(pub_payload))

            # Also publish to "dashboard" to trigger a counter increment
            dash_payload = {
                "event": "traffic_counter_increment",
                "increment": count,
            }
            await redis_client.publish("dashboard", json.dumps(dash_payload))

            msg = f"Worker bulk-ingested {count} packets and triggered websocket notifications."
            logger.info(msg)
            return msg
        finally:
            await RedisManager.disconnect()
            await MongoDBManager.disconnect()

    try:
        return run_async(_ingest())
    except Exception as e:
        err_msg = f"Failed task process_packet_batch: {e}"
        logger.error(err_msg)
        return err_msg
