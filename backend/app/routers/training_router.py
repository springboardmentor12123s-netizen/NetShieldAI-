"""
Feature 5 — Upload Dataset + Train Model from the UI.

Flow:
  1. POST /api/training/upload
     -> validate + store CSV, return dataset info

  2. POST /api/training/start
     -> kicks off training in the background

  3. GET /api/training/status/{id}
     -> poll progress/logs/metrics

  4. GET /api/training/history
     -> past training runs

  5. POST /api/training/activate/{id}
     -> makes that run's model the active prediction model

RBAC:
  - Admin:
      Upload dataset
      Start training
      Activate model

  - Security Analyst:
      View training status
      View training history

Training runs in a background thread using asyncio.to_thread
so it does not block the API.
"""

import asyncio
import shutil
import uuid
from datetime import datetime
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.auth import get_current_user, require_role
from app.config import settings
from app.database import (
    dataset_uploads_collection,
    log_audit,
    training_history_collection,
)
from app.ml import train_model
from app.ml.model import reload_model


router = APIRouter(
    prefix="/api/training",
    tags=["training"],
)


# ============================================================
# Dataset requirements
# ============================================================

REQUIRED_COLUMNS = (
    train_model.NUMERIC_FEATURES
    + train_model.CATEGORICAL_FEATURES
    + [train_model.LABEL_COLUMN]
)


# ============================================================
# In-memory training job tracker
# ============================================================

# training_id -> job information
#
# Fine for a single-process deployment.
# For multi-worker production deployment, use Redis or MongoDB.
_JOBS: dict[str, dict] = {}


# ============================================================
# Directory helpers
# ============================================================

def _upload_dir() -> Path:
    """
    Returns the directory used to store uploaded datasets.
    Creates it if it does not exist.
    """
    directory = Path(settings.upload_dir)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _candidates_dir() -> Path:
    """
    Returns the directory used to store candidate models.
    Creates it if it does not exist.
    """
    directory = Path(settings.upload_dir).parent / "model_candidates"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


# ============================================================
# Upload Dataset
# ============================================================

@router.post("/upload")
async def upload_dataset(
    file: UploadFile,
    current_user=Depends(require_role("admin")),
):
    """
    Upload and validate a CSV dataset.

    ADMIN ONLY.

    Security analysts cannot upload datasets.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only .csv files are supported",
        )

    upload_id = uuid.uuid4().hex[:12]

    destination = _upload_dir() / f"{upload_id}.csv"

    # Save uploaded file
    with destination.open("wb") as output_file:
        shutil.copyfileobj(file.file, output_file)

    # Read CSV
    try:
        dataframe = pd.read_csv(destination)
    except Exception as exc:
        destination.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail=f"Could not parse CSV: {exc}",
        )

    # Check required columns
    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in dataframe.columns
    ]

    if missing_columns:
        destination.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset is missing required columns: "
                f"{', '.join(missing_columns)}. "
                f"Required columns are: {', '.join(REQUIRED_COLUMNS)}"
            ),
        )

    # Check missing values
    missing_values = {
        column: int(dataframe[column].isna().sum())
        for column in dataframe.columns
        if int(dataframe[column].isna().sum()) > 0
    }

    # Class distribution
    class_distribution = (
        dataframe[train_model.LABEL_COLUMN]
        .value_counts()
        .to_dict()
        if train_model.LABEL_COLUMN in dataframe.columns
        else {}
    )

    class_distribution = {
        str(key): int(value)
        for key, value in class_distribution.items()
    }

    # Dataset information
    info = {
        "upload_id": upload_id,
        "filename": file.filename,
        "rows": int(len(dataframe)),
        "columns": list(dataframe.columns),
        "missing_values": missing_values,
        "total_missing": int(sum(missing_values.values())),
        "class_distribution": class_distribution,
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": current_user["username"],
        "path": str(destination),
    }

    # Store upload information in MongoDB
    await dataset_uploads_collection.insert_one(
        dict(info)
    )

    # Do not expose server filesystem path to frontend
    info.pop("path", None)

    return info


# ============================================================
# Training Progress Callback
# ============================================================

def _progress_callback(training_id: str):
    """
    Creates a callback used by the ML training process
    to update training progress.
    """

    def _callback(stage: str, message: str) -> None:
        job = _JOBS.get(training_id)

        if not job:
            return

        job["stage"] = stage
        job["logs"].append(message)

        stage_progress = {
            "loading_dataset": 10,
            "splitting": 20,
            "training": 40,
            "training_complete": 70,
            "evaluating": 80,
            "saving": 90,
            "completed": 100,
        }

        job["progress"] = stage_progress.get(
            stage,
            job["progress"],
        )

    return _callback


# ============================================================
# Background Training Job
# ============================================================

async def _run_training_job(
    training_id: str,
    dataset_path: str | None,
    upload_id: str | None,
    actor: str,
) -> None:
    """
    Runs the actual ML training in a background thread.
    """

    job = _JOBS[training_id]

    candidate_model_path = (
        _candidates_dir()
        / f"{training_id}_model.pkl"
    )

    candidate_metrics_path = (
        _candidates_dir()
        / f"{training_id}_metrics.json"
    )

    try:
        # Run CPU-heavy training outside the event loop
        metrics = await asyncio.to_thread(
            train_model.train,
            dataset_path,
            str(candidate_model_path),
            str(candidate_metrics_path),
            _progress_callback(training_id),
        )

        # Update in-memory job
        job["status"] = "completed"
        job["progress"] = 100
        job["metrics"] = metrics
        job["candidate_model_path"] = str(
            candidate_model_path
        )

        # Save training history
        history_doc = {
            "training_id": training_id,
            "upload_id": upload_id,
            "dataset_path": (
                dataset_path
                or settings.dataset_path
            ),
            "metrics": metrics,
            "created_at": datetime.utcnow(),
            "trained_by": actor,
            "activated": False,
        }

        await training_history_collection.insert_one(
            dict(history_doc)
        )

        # Audit log
        await log_audit(
            "model_training_completed",
            actor,
            {
                "training_id": training_id,
                "accuracy": metrics.get("accuracy"),
            },
        )

    except Exception as exc:
        job["status"] = "failed"
        job["error"] = str(exc)

        job["logs"].append(
            f"Training failed: {exc}"
        )

        await log_audit(
            "model_training_failed",
            actor,
            {
                "training_id": training_id,
                "error": str(exc),
            },
        )


# ============================================================
# Start Training
# ============================================================

@router.post("/start")
async def start_training(
    upload_id: str | None = None,
    current_user=Depends(require_role("admin")),
):
    """
    Start ML training in the background.

    ADMIN ONLY.

    If upload_id is provided, use that uploaded dataset.

    If upload_id is omitted, use the dataset configured
    in settings.dataset_path.
    """

    dataset_path = None

    # If a specific uploaded dataset was selected
    if upload_id:

        upload_doc = await dataset_uploads_collection.find_one(
            {"upload_id": upload_id}
        )

        if not upload_doc:
            raise HTTPException(
                status_code=404,
                detail="Uploaded dataset not found",
            )

        dataset_path = upload_doc["path"]

    # Generate training ID
    training_id = uuid.uuid4().hex[:12]

    # Create initial job
    _JOBS[training_id] = {
        "training_id": training_id,
        "status": "running",
        "stage": "queued",
        "progress": 0,
        "logs": ["Training queued..."],
        "metrics": None,
        "error": None,
    }

    # Start background training
    asyncio.create_task(
        _run_training_job(
            training_id,
            dataset_path,
            upload_id,
            current_user["username"],
        )
    )

    return {
        "training_id": training_id,
        "status": "running",
    }


# ============================================================
# Training Status
# ============================================================

@router.get("/status/{training_id}")
async def training_status(
    training_id: str,
    current_user=Depends(get_current_user),
):
    """
    Get current training progress.

    Available to both admin and security analyst.
    """

    job = _JOBS.get(training_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Unknown training job",
        )

    return job


# ============================================================
# Training History
# ============================================================

@router.get("/history")
async def training_history(
    limit: int = 20,
    current_user=Depends(get_current_user),
):
    """
    Get previous training runs.

    Available to both admin and security analyst.
    """

    # Prevent unreasonable limits
    limit = max(1, min(limit, 100))

    cursor = (
        training_history_collection
        .find()
        .sort("created_at", -1)
        .limit(limit)
    )

    items = []

    async for document in cursor:

        document["id"] = str(
            document.pop("_id")
        )

        items.append(document)

    return items


# ============================================================
# Activate Model
# ============================================================

@router.post("/activate/{training_id}")
async def activate_model(
    training_id: str,
    current_user=Depends(require_role("admin")),
):
    """
    Make a trained model the active prediction model.

    ADMIN ONLY.

    The model is hot-swapped without restarting the server.
    """

    job = _JOBS.get(training_id)

    candidate_model_path = None
    candidate_metrics_path = None

    # --------------------------------------------------------
    # Training completed during current server session
    # --------------------------------------------------------

    if job and job.get("status") == "completed":

        candidate_model_path = Path(
            job["candidate_model_path"]
        )

        candidate_metrics_path = (
            candidate_model_path.parent
            / f"{training_id}_metrics.json"
        )

    # --------------------------------------------------------
    # Server restarted after training
    # --------------------------------------------------------

    else:

        candidate_model_path = (
            _candidates_dir()
            / f"{training_id}_model.pkl"
        )

        candidate_metrics_path = (
            _candidates_dir()
            / f"{training_id}_metrics.json"
        )

    # Check candidate model
    if not candidate_model_path.exists():

        raise HTTPException(
            status_code=404,
            detail=(
                "Trained model for this run was not found. "
                "Please retrain."
            ),
        )

    # Make sure model directory exists
    Path(settings.model_path).parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    # Copy candidate model to active model
    shutil.copyfile(
        candidate_model_path,
        settings.model_path,
    )

    # Copy metrics if available
    if candidate_metrics_path.exists():

        shutil.copyfile(
            candidate_metrics_path,
            settings.model_metrics_path,
        )

    # Hot reload the model
    reload_model()

    # Mark all previous models as inactive
    await training_history_collection.update_many(
        {},
        {
            "$set": {
                "activated": False
            }
        },
    )

    # Mark selected model as active
    await training_history_collection.update_one(
        {"training_id": training_id},
        {
            "$set": {
                "activated": True
            }
        },
    )

    # Audit log
    await log_audit(
        "model_activated",
        current_user["username"],
        {
            "training_id": training_id
        },
    )

    return {
        "message": (
            "Model activated and is now live "
            "for predictions."
        ),
        "training_id": training_id,
    }