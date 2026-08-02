from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Alert
from fastapi import HTTPException
router = APIRouter()


@router.get("/")
def get_alerts(db: Session = Depends(get_db)):

    alerts = (
        db.query(Alert)
        .order_by(Alert.detected_at.desc())
        .all()
    )

    return [
        {
            "id": alert.id,
            "source_ip": alert.source_ip,
            "destination_ip": alert.destination_ip,
            "protocol": alert.protocol,
            "attack_type": alert.attack_type,
            "severity": alert.severity,
            "status": alert.status,
            "detected_at": alert.detected_at,
        }
        for alert in alerts
    ]
@router.put("/{alert_id}")
def update_alert_status(
    alert_id: int,
    status: str,
    db: Session = Depends(get_db),
):

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.status = status.upper()

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert updated successfully",
        "alert": alert,
    }