
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.alert import Alert, AlertStatus
from app.models.anomaly import AnomalyResult
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alert Management"])


class StatusUpdateRequest(BaseModel):
    status: str
    notes: str | None = None


def _serialize(a: Alert):
    source = None
    if a.anomaly_result and a.anomaly_result.traffic_record:
        source = a.anomaly_result.traffic_record.source

    return {
        "id": a.id,
        "title": a.title,
        "description": a.description,
        "severity": a.severity,
        "risk_score": a.risk_score,
        "status": a.status.value,
        "notes": a.notes,
        "assigned_to": a.assigned_to,
        "source": source,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
        "resolved_at": a.resolved_at,
    }


@router.get("")
def list_alerts(
    status_filter: str | None = None,
    source_filter: str | None = Query(None, description="synthetic or live_capture"),
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Alert)
        .options(joinedload(Alert.anomaly_result).joinedload(AnomalyResult.traffic_record))
        .order_by(Alert.created_at.desc())
    )
    if status_filter:
        query = query.filter(Alert.status == status_filter)

    alerts = query.limit(limit * 3 if source_filter else limit).all()

    results = [_serialize(a) for a in alerts]
    if source_filter:
        results = [r for r in results if r["source"] == source_filter][:limit]

    return results


@router.get("/stats")
def alert_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # --- Status counts: single SQL GROUP BY instead of loading all rows ---
    status_counts = dict(
        db.query(Alert.status, func.count(Alert.id))
        .group_by(Alert.status)
        .all()
    )
    total_open = status_counts.get(AlertStatus.OPEN, 0)
    total_ack = status_counts.get(AlertStatus.ACKNOWLEDGED, 0)
    total_resolved = status_counts.get(AlertStatus.RESOLVED, 0)
    total_false_positive = status_counts.get(AlertStatus.FALSE_POSITIVE, 0)

    # --- Critical count: SQL COUNT with filter ---
    total_critical = (
        db.query(func.count(Alert.id))
        .filter(Alert.severity == "critical")
        .scalar()
    )

    # --- Resolved today: SQL COUNT with date filter ---
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = (
        db.query(func.count(Alert.id))
        .filter(Alert.resolved_at >= today_start)
        .scalar()
    )

    # --- 7-day trend: SQL GROUP BY on date, only pulling last 7 days ---
    since = datetime.utcnow() - timedelta(days=7)
    daily_counts = dict(
        db.query(func.date(Alert.created_at), func.count(Alert.id))
        .filter(Alert.created_at >= since)
        .group_by(func.date(Alert.created_at))
        .all()
    )

    buckets = {}
    now = datetime.utcnow()
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_label = day_date.strftime("%b %d")
        buckets[day_label] = daily_counts.get(day_date, 0)
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