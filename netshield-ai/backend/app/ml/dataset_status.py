"""Shared helper: figures out where the dataset/model/training pipeline
currently stands, for the Dashboard's "Dataset Status" / "AI Model Status"
cards and the /api/dashboard/summary endpoint."""
import json
from pathlib import Path

import pandas as pd

from app.config import settings


def get_dataset_status() -> dict:
    path = Path(settings.dataset_path)
    if not path.exists():
        return {"status": "waiting_for_dataset", "label": "Waiting for Dataset", "rows": 0}

    try:
        df = pd.read_csv(path, nrows=1)
        row_count = sum(1 for _ in open(path)) - 1  # cheap row count, minus header
    except Exception:
        return {"status": "dataset_not_found", "label": "Dataset Not Found / Unreadable", "rows": 0}

    model_path = Path(settings.model_path)
    if model_path.exists():
        return {"status": "training_completed", "label": "Training Completed", "rows": row_count}
    return {"status": "ready_for_training", "label": "Dataset Loaded — Ready for Training", "rows": row_count}


def get_model_status() -> dict:
    model_path = Path(settings.model_path)
    metrics_path = Path(settings.model_metrics_path)
    if not model_path.exists():
        return {"status": "not_trained", "label": "No Model Trained", "metrics": None}

    metrics = None
    if metrics_path.exists():
        try:
            metrics = json.loads(metrics_path.read_text())
        except Exception:
            metrics = None

    return {"status": "active", "label": "Model Active", "metrics": metrics}
