from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.anomaly import Anomaly

import asyncio

router = APIRouter()

clients = []


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    clients.append(websocket)

    db: Session = SessionLocal()

    last_id = 0

    try:

        while True:

            latest = (
                db.query(Anomaly)
                .filter(Anomaly.id > last_id)
                .order_by(Anomaly.id)
                .all()
            )

            for row in latest:

                await websocket.send_json({

                    "type": "prediction",

                    "id": row.id,

                    "attack": row.anomaly_type,

                    "confidence": row.confidence_score,

                    "source_ip": row.source_ip,

                    "destination_ip": row.destination_ip,

                    "status": row.status,

                    "created_at": str(row.created_at),

                })

                last_id = row.id

            await asyncio.sleep(1)

    except WebSocketDisconnect:

        if websocket in clients:
            clients.remove(websocket)

        db.close()