"""
Alert Management Module - minimal read/acknowledge API.
Full incident workflow, notifications, and escalation land in Milestone 3;
this stub exists so alerts auto-created by the risk scoring engine (Milestone 2)
are visible on the dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.alert import Alert, AlertStatus
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alert Management"])


@router.get("")
def list_alerts(
    status_filter: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    alerts = query.limit(limit).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "severity": a.severity,
            "risk_score": a.risk_score,
            "status": a.status.value,
            "created_at": a.created_at,
        }
        for a in alerts
    ]


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.assigned_to = current_user.id
    db.commit()
    return {"id": alert.id, "status": alert.status.value}
