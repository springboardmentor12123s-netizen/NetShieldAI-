
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.alert import Alert, AlertStatus
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alert Management"])


class StatusUpdateRequest(BaseModel):
    status: str
    notes: str | None = None


def _serialize(a: Alert):
    return {
        "id": a.id,
        "title": a.title,
        "description": a.description,
        "severity": a.severity,
        "risk_score": a.risk_score,
        "status": a.status.value,
        "notes": a.notes,
        "assigned_to": a.assigned_to,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
        "resolved_at": a.resolved_at,
    }


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
    return [_serialize(a) for a in alerts]


@router.get("/stats")
def alert_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    all_alerts = db.query(Alert).all()

    total_open = sum(1 for a in all_alerts if a.status == AlertStatus.OPEN)
    total_ack = sum(1 for a in all_alerts if a.status == AlertStatus.ACKNOWLEDGED)
    total_resolved = sum(1 for a in all_alerts if a.status == AlertStatus.RESOLVED)
    total_false_positive = sum(1 for a in all_alerts if a.status == AlertStatus.FALSE_POSITIVE)
    total_critical = sum(1 for a in all_alerts if a.severity == "critical")

    today = datetime.utcnow().date()
    resolved_today = sum(
        1 for a in all_alerts
        if a.resolved_at and a.resolved_at.date() == today
    )

    # Alerts created per day, last 7 days
    buckets = {}
    now = datetime.utcnow()
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).strftime("%b %d")
        buckets[day] = 0
    for a in all_alerts:
        key = a.created_at.strftime("%b %d")
        if key in buckets:
            buckets[key] += 1
    trend = [{"day": k, "count": v} for k, v in buckets.items()]

    return {
        "total_open": total_open,
        "total_acknowledged": total_ack,
        "total_resolved": total_resolved,
        "total_false_positive": total_false_positive,
        "total_critical": total_critical,
        "resolved_today": resolved_today,
        "trend": trend,
    }


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.assigned_to = current_user.id
    db.commit()
    return _serialize(alert)


@router.post("/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    payload: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    try:
        new_status = AlertStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    alert.status = new_status
    alert.assigned_to = current_user.id
    if payload.notes is not None:
        alert.notes = payload.notes
    if new_status in (AlertStatus.RESOLVED, AlertStatus.FALSE_POSITIVE):
        alert.resolved_at = datetime.utcnow()
    else:
        alert.resolved_at = None

    db.commit()
    return _serialize(alert)