from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.network_packet import NetworkPacket

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/live-packets")
def get_live_packets(db: Session = Depends(get_db)):

    return (
        db.query(NetworkPacket)
        .order_by(NetworkPacket.id.desc())
        .limit(200)
        .all()
    )