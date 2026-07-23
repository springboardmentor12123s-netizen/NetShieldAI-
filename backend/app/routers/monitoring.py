"""
NetShield AI — Monitoring and activity endpoints.

Provides dashboard statistics, alert listings, and dataset upload history
for the frontend.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, DatasetRecord, TrainingRun

router = APIRouter(tags=["Monitoring"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    """
    Return aggregated statistics for the security overview dashboard.

    Includes totals, traffic distribution, and per-dataset activity
    for the eight most recently uploaded datasets.
    """
    total_datasets = db.scalar(select(func.count()).select_from(DatasetRecord)) or 0
    total_records = db.scalar(select(func.coalesce(func.sum(DatasetRecord.row_count), 0))) or 0
    normal_count = db.scalar(select(func.coalesce(func.sum(DatasetRecord.normal_count), 0))) or 0
    attack_count = db.scalar(select(func.coalesce(func.sum(DatasetRecord.attack_count), 0))) or 0
    latest_run = db.scalars(select(TrainingRun).order_by(TrainingRun.trained_at.desc())).first()
    records = db.scalars(select(DatasetRecord).order_by(DatasetRecord.uploaded_at.asc())).all()
    return {
        "total_datasets": total_datasets,
        "total_records": total_records,
        "normal_count": normal_count,
        "attack_count": attack_count,
        "detection_accuracy": latest_run.accuracy if latest_run else 0,
        "traffic_distribution": [
            {"name": "Normal", "value": normal_count},
            {"name": "Attack", "value": attack_count},
        ],
        "dataset_activity": [
            {
                "name": item.original_name[:18],
                "records": item.row_count,
                "anomalies": item.attack_count,
            }
            for item in records[-8:]
        ],
    }


@router.get("/alerts")
def alerts(db: Session = Depends(get_db)):
    """Return all anomaly alerts ordered by most recent first."""
    rows = db.execute(
        select(Alert, DatasetRecord.original_name)
        .join(DatasetRecord, Alert.dataset_id == DatasetRecord.id)
        .order_by(Alert.created_at.desc())
    ).all()
    return [
        {
            "id": alert.id,
            "dataset_name": name,
            "row_number": alert.row_number,
            "prediction": alert.prediction,
            "severity": alert.severity,
            "timestamp": alert.created_at,
        }
        for alert, name in rows
    ]


@router.get("/history")
def history(db: Session = Depends(get_db)):
    """Return the full dataset upload history ordered by most recent first."""
    rows = db.scalars(select(DatasetRecord).order_by(DatasetRecord.uploaded_at.desc())).all()
    return [
        {
            "id": row.id,
            "dataset_name": row.original_name,
            "purpose": row.purpose,
            "upload_time": row.uploaded_at,
            "accuracy": row.accuracy,
            "prediction_count": row.prediction_count,
            "record_count": row.row_count,
        }
        for row in rows
    ]
