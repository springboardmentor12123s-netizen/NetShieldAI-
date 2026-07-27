"""
Feature 5 — Upload Dataset + Train Model from the UI.

Flow:
  1. POST /api/training/upload      -> validate + store CSV, return dataset info
  2. POST /api/training/start       -> kicks off training in the background
  3. GET  /api/training/status/{id} -> poll progress/logs/metrics (used for the progress bar)
  4. GET  /api/training/history     -> past training runs
  5. POST /api/training/activate/{id} -> makes that run's model the active prediction model

Training runs in a background thread (via asyncio.to_thread) so it never
blocks the API or other features (live capture, manual predictions, etc.)
while it's running. Progress is tracked in an in-memory dict keyed by
training_id; the final result is persisted to MongoDB (training_history
collection) once training completes.
"""
import shutil
import uuid
from datetime import datetime
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile

from app.auth import get_current_user, require_role
from app.config import settings
from app.database import dataset_uploads_collection, log_audit, training_history_collection
from app.ml import train_model
from app.ml.model import reload_model

router = APIRouter(prefix="/api/training", tags=["training"])

REQUIRED_COLUMNS = train_model.NUMERIC_FEATURES + train_model.CATEGORICAL_FEATURES + [train_model.LABEL_COLUMN]

# In-memory progress tracker: training_id -> job dict. Fine for a single-process
# deployment; swap for Redis/DB-backed tracking if this ever runs multi-worker.
_JOBS: dict[str, dict] = {}


def _upload_dir() -> Path:
    d = Path(settings.upload_dir)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _candidates_dir() -> Path:
    d = Path(settings.upload_dir).parent / "model_candidates"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.post("/upload")
async def upload_dataset(file: UploadFile, current_user=Depends(require_role("admin", "security_analyst"))):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")

    upload_id = uuid.uuid4().hex[:12]
    dest = _upload_dir() / f"{upload_id}.csv"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        df = pd.read_csv(dest)
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}")

    missing_columns = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_columns:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset is missing required columns: "
                f"{', '.join(missing_columns)}. Required columns are: {', '.join(REQUIRED_COLUMNS)}"
            ),
        )

    missing_values = {col: int(df[col].isna().sum()) for col in df.columns if int(df[col].isna().sum()) > 0}
    class_distribution = (
        df[train_model.LABEL_COLUMN].value_counts().to_dict() if train_model.LABEL_COLUMN in df.columns else {}
    )
    class_distribution = {str(k): int(v) for k, v in class_distribution.items()}

    info = {
        "upload_id": upload_id,
        "filename": file.filename,
        "rows": int(len(df)),
        "columns": list(df.columns),
        "missing_values": missing_values,
        "total_missing": int(sum(missing_values.values())),
        "class_distribution": class_distribution,
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": current_user["username"],
        "path": str(dest),
    }
    await dataset_uploads_collection.insert_one(dict(info))
    info.pop("path")  # don't leak server filesystem paths to the client
    return info


def _progress_callback(training_id: str):
    def _cb(stage: str, message: str) -> None:
        job = _JOBS.get(training_id)
        if not job:
            return
        job["stage"] = stage
        job["logs"].append(message)
        stage_progress = {
            "loading_dataset": 10, "splitting": 20, "training": 40,
            "training_complete": 70, "evaluating": 80, "saving": 90, "completed": 100,
        }
        job["progress"] = stage_progress.get(stage, job["progress"])
    return _cb


async def _run_training_job(training_id: str, dataset_path: str | None, upload_id: str | None, actor: str) -> None:
    import asyncio

    job = _JOBS[training_id]
    candidate_model_path = _candidates_dir() / f"{training_id}_model.pkl"
    candidate_metrics_path = _candidates_dir() / f"{training_id}_metrics.json"

    try:
        metrics = await asyncio.to_thread(
            train_model.train,
            dataset_path,
            str(candidate_model_path),
            str(candidate_metrics_path),
            _progress_callback(training_id),
        )
        job["status"] = "completed"
        job["progress"] = 100
        job["metrics"] = metrics
        job["candidate_model_path"] = str(candidate_model_path)

        history_doc = {
            "training_id": training_id,
            "upload_id": upload_id,
            "dataset_path": dataset_path or settings.dataset_path,
            "metrics": metrics,
            "created_at": datetime.utcnow(),
            "trained_by": actor,
            "activated": False,
        }
        await training_history_collection.insert_one(dict(history_doc))
        await log_audit("model_training_completed", actor, {"training_id": training_id, "accuracy": metrics["accuracy"]})
    except Exception as exc:
        job["status"] = "failed"
        job["error"] = str(exc)
        job["logs"].append(f"Training failed: {exc}")
        await log_audit("model_training_failed", actor, {"training_id": training_id, "error": str(exc)})


@router.post("/start")
async def start_training(
    upload_id: str | None = None,
    current_user=Depends(require_role("admin", "security_analyst")),
):
    """Starts training in the background. If upload_id is omitted, trains
    on the dataset already configured at settings.dataset_path."""
    dataset_path = None
    if upload_id:
        upload_doc = await dataset_uploads_collection.find_one({"upload_id": upload_id})
        if not upload_doc:
            raise HTTPException(status_code=404, detail="Uploaded dataset not found")
        dataset_path = upload_doc["path"]

    training_id = uuid.uuid4().hex[:12]
    _JOBS[training_id] = {
        "training_id": training_id, "status": "running", "stage": "queued",
        "progress": 0, "logs": ["Training queued..."], "metrics": None, "error": None,
    }

    import asyncio
    asyncio.create_task(_run_training_job(training_id, dataset_path, upload_id, current_user["username"]))
    return {"training_id": training_id, "status": "running"}


@router.get("/status/{training_id}")
async def training_status(training_id: str, current_user=Depends(get_current_user)):
    job = _JOBS.get(training_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown training job")
    return job


@router.get("/history")
async def training_history(limit: int = 20, current_user=Depends(get_current_user)):
    cursor = training_history_collection.find().sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return items


@router.post("/activate/{training_id}")
async def activate_model(training_id: str, current_user=Depends(require_role("admin", "security_analyst"))):
    """'Replace Current Model' — makes this training run's model the live
    prediction model, with zero downtime (in-process cache reload)."""
    job = _JOBS.get(training_id)
    candidate_model_path = None
    candidate_metrics_path = None

    if job and job.get("status") == "completed":
        candidate_model_path = Path(job["candidate_model_path"])
        candidate_metrics_path = Path(job["candidate_model_path"]).with_name(f"{training_id}_metrics.json")
    else:
        # Server may have restarted since training finished — fall back to disk.
        candidate_model_path = _candidates_dir() / f"{training_id}_model.pkl"
        candidate_metrics_path = _candidates_dir() / f"{training_id}_metrics.json"

    if not candidate_model_path.exists():
        raise HTTPException(status_code=404, detail="Trained model for this run was not found. Please retrain.")

    Path(settings.model_path).parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(candidate_model_path, settings.model_path)
    if candidate_metrics_path.exists():
        shutil.copyfile(candidate_metrics_path, settings.model_metrics_path)

    reload_model()  # hot-swap — no restart needed

    await training_history_collection.update_many({}, {"$set": {"activated": False}})
    await training_history_collection.update_one({"training_id": training_id}, {"$set": {"activated": True}})
    await log_audit("model_activated", current_user["username"], {"training_id": training_id})

    return {"message": "Model activated and is now live for predictions.", "training_id": training_id}
