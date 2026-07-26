from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from app.auth.dependencies import require_admin, require_analyst
from app.models.user import User
from app.services.ml import train_anomaly_model, train_threat_model, predict_traffic, get_ml_reports

router = APIRouter(prefix="/ml", tags=["ml"])

from app.database import mongo_db

@router.post("/train/anomaly")
async def trigger_anomaly_training(background_tasks: BackgroundTasks, current_user: User = Depends(require_admin)):
    # Run in background to not block the request
    background_tasks.add_task(train_anomaly_model)
    count = await mongo_db.traffic.count_documents({"label": "BENIGN"})
    etc = max(5, int(count * 0.005))
    return {"message": "Anomaly model training started", "etc_seconds": etc}

@router.post("/train/threat")
async def trigger_threat_training(background_tasks: BackgroundTasks, current_user: User = Depends(require_admin)):
    background_tasks.add_task(train_threat_model)
    count = await mongo_db.traffic.count_documents({})
    etc = max(5, int(count * 0.005))
    return {"message": "Threat model training started", "etc_seconds": etc}

@router.post("/predict")
async def trigger_prediction(limit: int = 1000, current_user: User = Depends(require_analyst)):
    result = await predict_traffic(limit)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/reports")
async def get_reports(current_user: User = Depends(require_analyst)):
    return await get_ml_reports()
