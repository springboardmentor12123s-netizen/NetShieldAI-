from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DatasetRecord, TrainingRun
from app.services.ml_service import train_model

router = APIRouter(tags=["Machine Learning"])
BACKEND_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BACKEND_DIR / "saved_models" / "isolation_forest.joblib"
UPLOAD_DIR = BACKEND_DIR / "uploads"


@router.post("/train")
def train(dataset_id: int | None = None, db: Session = Depends(get_db)):
    query = select(DatasetRecord).where(DatasetRecord.purpose == "training")
    if dataset_id is not None:
        query = query.where(DatasetRecord.id == dataset_id)
    query = query.order_by(DatasetRecord.uploaded_at.desc())
    dataset = db.scalars(query).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Upload a training dataset first.")

    frame = pd.read_csv(UPLOAD_DIR / dataset.stored_name, low_memory=False)
    metrics = train_model(frame, MODEL_PATH)
    matrix = metrics["confusion_matrix"]
    run = TrainingRun(
        dataset_id=dataset.id,
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        tn=matrix[0][0],
        fp=matrix[0][1],
        fn=matrix[1][0],
        tp=matrix[1][1],
        feature_count=metrics["feature_count"],
    )
    dataset.accuracy = metrics["accuracy"]
    db.add(run)
    db.commit()
    return {"dataset_id": dataset.id, "dataset_name": dataset.original_name, **metrics}
