"""NetShield AI - WebSocket Connection Manager."""

import asyncio
import json
import logging
from typing import Dict, Set, Optional

from fastapi import WebSocket, status, Query

from app.core.redis import RedisManager
from app.core.security import decode_token

logger = logging.getLogger("app")


class ConnectionManager:
    """Manages system-wide WebSocket connections and Redis Pub/Sub subscription mapping."""

    def __init__(self):
        # Maps channel name (string) -> set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "traffic": set(),
            "alerts": set(),
            "dashboard": set(),
            "system": set(),
        }
        self.listener_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, channel: str) -> None:
        """Accept connection and add it to the channel client pool."""
        if channel not in self.active_connections:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unknown channel")
            return

        await websocket.accept()
        self.active_connections[channel].add(websocket)
        logger.info(
            f"Client WebSocket connected to channel: {channel}. Total connections for {channel}: {len(self.active_connections[channel])}"
        )

        # Make sure Redis listener for this channel is active if Redis is running
        if await RedisManager.is_available():
            await self.start_redis_listener(channel)
        else:
            logger.warning(
                f"Redis is not available - WebSocket running in local in-memory fallback helper mode for channel: {channel}"
            )

    def disconnect(self, websocket: WebSocket, channel: str) -> None:
        """Remove connection from the channel client pool."""
        if channel in self.active_connections and websocket in self.active_connections[channel]:
            self.active_connections[channel].remove(websocket)
            logger.info(
                f"Client WebSocket disconnected from channel: {channel}. Total remaining: {len(self.active_connections[channel])}"
            )

    async def broadcast(self, channel: str, message: dict) -> None:
        """Broadcast JSON message to all connected clients in a channel."""
        if channel not in self.active_connections or not self.active_connections[channel]:
            return

        disconnected_sockets = set()
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message on channel {channel} to client: {e}")
                disconnected_sockets.add(connection)

        for connection in disconnected_sockets:
            self.disconnect(connection, channel)

    async def start_redis_listener(self, channel: str) -> None:
        """Guarantee that a background task exists to listen to the Redis Pub/Sub channel."""
        if channel not in self.listener_tasks or self.listener_tasks[channel].done():
            self.listener_tasks[channel] = asyncio.create_task(
                self._listen_to_redis_channel(channel)
            )
            logger.info(f"Started baseline Redis subscriber for channel: {channel}")

    async def stop_all_listeners(self) -> None:
        """Shutdown all background Redis listeners."""
        for channel, task in list(self.listener_tasks.items()):
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self.listener_tasks.clear()
        logger.info("All Redis pub/sub listener tasks cancelled")

    async def _listen_to_redis_channel(self, channel: str) -> None:
        """Subscribe to Redis pub/sub channel and relay messages to broadcast."""
        while True:
            try:
                redis_client = RedisManager.get_client()
                pubsub = redis_client.pubsub()
                await pubsub.subscribe(channel)
                logger.info(f"Subscribed to Redis channel: {channel}")

                async for message in pubsub.listen():
                    if message["type"] == "message":
                        try:
                            # Forward structured JSON objects directly
                            data = json.loads(message["data"]) if isinstance(message["data"], str) else message["data"]
                            await self.broadcast(channel, data)
                        except Exception as e:
                            logger.error(f"Error handling pubsub message on channel {channel}: {e}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"Redis pub/sub connection error on channel {channel}: {e}. Retrying in 5 seconds..."
                )
                await asyncio.sleep(5)


# Global connection manager instance
manager = ConnectionManager()


async def authenticate_websocket(websocket: WebSocket, token: Optional[str] = Query(None)) -> tuple[bool, Optional[dict]]:
    """Verify access token query parameter, returns (success_flag, jwt_payload)."""
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
        return False, None

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token type")
            return False, None
        return True, payload
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid or expired token")
        return False, None
