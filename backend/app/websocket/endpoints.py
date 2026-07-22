"""NetShield AI - WebSocket Endpoints Router."""

import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.connection_manager import manager, authenticate_websocket

logger = logging.getLogger("app")

router = APIRouter(prefix="/ws", tags=["websockets"])


@router.websocket("/traffic")
async def websocket_traffic(websocket: WebSocket, token: Optional[str] = None):
    """Real-time network traffic/packet stream."""
    success, payload = await authenticate_websocket(websocket, token)
    if not success:
        return

    # WebSocket accepted in manager.connect
    await manager.connect(websocket, "traffic")
    try:
        while True:
            # Sockets remain open by waiting for client messages or disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "traffic")
    except Exception as e:
        logger.error(f"Error in traffic WebSocket connection: {e}")
        manager.disconnect(websocket, "traffic")


@router.websocket("/dashboard")
async def websocket_dashboard(websocket: WebSocket, token: Optional[str] = None):
    """Real-time dashboard statistical metrics stream."""
    success, payload = await authenticate_websocket(websocket, token)
    if not success:
        return

    await manager.connect(websocket, "dashboard")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "dashboard")
    except Exception as e:
        logger.error(f"Error in dashboard WebSocket connection: {e}")
        manager.disconnect(websocket, "dashboard")


@router.websocket("/alerts")
async def websocket_alerts(websocket: WebSocket, token: Optional[str] = None):
    """Real-time threat alerts stream."""
    success, payload = await authenticate_websocket(websocket, token)
    if not success:
        return

    await manager.connect(websocket, "alerts")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "alerts")
    except Exception as e:
        logger.error(f"Error in alerts WebSocket connection: {e}")
        manager.disconnect(websocket, "alerts")


@router.websocket("/system")
async def websocket_system(websocket: WebSocket, token: Optional[str] = None):
    """Real-time system health metrics (CPU, RAM, Disk) stream."""
    success, payload = await authenticate_websocket(websocket, token)
    if not success:
        return

    await manager.connect(websocket, "system")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "system")
    except Exception as e:
        logger.error(f"Error in system WebSocket connection: {e}")
        manager.disconnect(websocket, "system")
