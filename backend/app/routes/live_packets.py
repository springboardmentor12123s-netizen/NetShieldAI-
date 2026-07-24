from fastapi import APIRouter
from app.packet_capture.live_packets import live_packets

router = APIRouter()

@router.get("/live-packets")
def get_live_packets():
    return list(live_packets)