"""
Feature 1 — Live Network Packet Capture: start/stop/status API.

Manual testing (POST /api/predict directly, and /api/packets/simulate)
continues to work exactly as before — this only adds an automatic,
continuous data source on top of the same pipeline.
"""
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.database import log_audit
from app.ml.capture import engine

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/status")
async def status(current_user=Depends(get_current_user)):
    return engine.status()


@router.post("/start")
async def start_monitoring(current_user=Depends(get_current_user)):
    if engine.is_running:
        return {"message": "Monitoring is already running", **engine.status()}
    try:
        engine.start()
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    await log_audit("live_monitoring_started", current_user["username"])
    return {"message": "Live packet monitoring started", **engine.status()}


@router.post("/stop")
async def stop_monitoring(current_user=Depends(get_current_user)):
    engine.stop()
    await log_audit("live_monitoring_stopped", current_user["username"])
    return {
        "message": "Live packet monitoring stopped",
        **engine.status(),
    }