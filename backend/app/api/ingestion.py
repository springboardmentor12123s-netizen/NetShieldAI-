from fastapi import APIRouter, Depends, BackgroundTasks
from app.auth.dependencies import require_admin
from app.models.user import User
from app.services.ingestion import ingest_cicids2017_file, ingest_unsw_nb15_file

router = APIRouter(prefix="/ingestion", tags=["ingestion"])

@router.post("/cicids2017")
async def ingest_cicids2017(file_path: str, background_tasks: BackgroundTasks, current_user: User = Depends(require_admin)):
    background_tasks.add_task(ingest_cicids2017_file, file_path)
    return {"message": "CICIDS2017 ingestion started"}

@router.post("/unsw-nb15")
async def ingest_unsw_nb15(file_path: str, background_tasks: BackgroundTasks, current_user: User = Depends(require_admin)):
    background_tasks.add_task(ingest_unsw_nb15_file, file_path)
    return {"message": "UNSW-NB15 ingestion started"}
