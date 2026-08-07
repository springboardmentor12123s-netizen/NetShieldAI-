from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.capture_service import capture_service
from app.services.flow_builder import flow_builder
from app.services.feature_extractor import feature_extractor
from app.services.live_predictor import live_predictor
router = APIRouter(tags=["Live Monitoring"])


class StartCaptureRequest(BaseModel):
    interface_id: str


@router.get("/live/interfaces")
def get_interfaces():
    interfaces = capture_service.get_interfaces()
    return {"interfaces": interfaces}


@router.post("/live/start")
def start_capture(request: StartCaptureRequest):
    try:
        capture_service.start_capture(request.interface_id)
        return {"status": "started", "interface": request.interface_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start capture: {e}")


@router.post("/live/stop")
def stop_capture():
    capture_service.stop_capture()
    return {"status": "stopped"}


@router.get("/live/status")
def get_status():
    return capture_service.get_status()


@router.get("/live/flows")
def get_active_flows():
    return flow_builder.get_active_flows()


@router.get("/live/flow-statistics")
def get_flow_statistics():
    return flow_builder.get_statistics()


@router.get("/live/features")
def get_extracted_features():
    return {"features": feature_extractor.get_latest_features()}


@router.get("/live/predictions")
def get_live_predictions():
    return {"predictions": live_predictor.get_latest_predictions()}
