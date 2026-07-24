from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.anomaly_schema import AnomalyCreate
from app.services.anomaly_service import (
    create_anomaly,
    get_all_anomalies,
    get_anomaly_by_id,
    delete_anomaly
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/anomalies")
def add_anomaly(
    anomaly: AnomalyCreate,
    db: Session = Depends(get_db)
):
    return create_anomaly(db, anomaly)


@router.get("/anomalies")
def view_anomalies(
    db: Session = Depends(get_db)
):
    return get_all_anomalies(db)


@router.get("/anomalies/{anomaly_id}")
def view_anomaly(
    anomaly_id: int,
    db: Session = Depends(get_db)
):
    anomaly = get_anomaly_by_id(db, anomaly_id)

    if anomaly is None:
        raise HTTPException(
            status_code=404,
            detail="Anomaly not found"
        )

    return anomaly


@router.delete("/anomalies/{anomaly_id}")
def remove_anomaly(
    anomaly_id: int,
    db: Session = Depends(get_db)
):
    success = delete_anomaly(db, anomaly_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Anomaly not found"
        )

    return {
        "message": "Anomaly deleted successfully"
    }