from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.alert import Alert, AlertStatus
from app.models.anomaly import AnomalyResult, DetectionModelRun
from app.models.traffic import TrafficRecord
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Threat Intelligence Reports"])


@router.get("/threat-intelligence")
def threat_intelligence_report(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.utcnow() - timedelta(days=days)

    
    total_alerts = (
        db.query(func.count(Alert.id))
        .filter(Alert.created_at >= since)
        .scalar()
    )

    status_counts = dict(
        db.query(Alert.status, func.count(Alert.id))
        .filter(Alert.created_at >= since)
        .group_by(Alert.status)
        .all()
    )
    resolved_count = status_counts.get(AlertStatus.RESOLVED, 0)
    false_positive_count = status_counts.get(AlertStatus.FALSE_POSITIVE, 0)
    status_breakdown = {k.value: v for k, v in status_counts.items()}

    severity_counts = dict(
        db.query(Alert.severity, func.count(Alert.id))
        .filter(Alert.created_at >= since)
        .group_by(Alert.severity)
        .all()
    )

    # --- Anomaly / detection summary: SQL aggregation ---
    total_scored = (
        db.query(func.count(AnomalyResult.id))
        .filter(AnomalyResult.created_at >= since)
        .scalar()
    ) or 0

    total_anomalies = (
        db.query(func.count(AnomalyResult.id))
        .filter(AnomalyResult.created_at >= since, AnomalyResult.is_anomaly == 1)
        .scalar()
    ) or 0

    avg_risk_score = (
        db.query(func.avg(AnomalyResult.risk_score))
        .filter(AnomalyResult.created_at >= since)
        .scalar()
    )
    avg_risk_score = round(avg_risk_score, 2) if avg_risk_score else 0.0

    attack_rows = (
        db.query(AnomalyResult.predicted_attack_type, func.count(AnomalyResult.id))
        .filter(
            AnomalyResult.created_at >= since,
            AnomalyResult.predicted_attack_type != "benign",
        )
        .group_by(AnomalyResult.predicted_attack_type)
        .all()
    )
    attack_breakdown = dict(attack_rows)

    # --- Top attackers / targets: SQL join + GROUP BY, limited to top 5 ---
    top_attackers_rows = (
        db.query(TrafficRecord.src_ip, func.count(AnomalyResult.id).label("cnt"))
        .join(AnomalyResult, AnomalyResult.traffic_record_id == TrafficRecord.id)
        .filter(AnomalyResult.created_at >= since, AnomalyResult.is_anomaly == 1)
        .group_by(TrafficRecord.src_ip)
        .order_by(func.count(AnomalyResult.id).desc())
        .limit(5)
        .all()
    )
    top_attackers = [{"ip": ip, "count": c} for ip, c in top_attackers_rows]

    top_targets_rows = (
        db.query(TrafficRecord.dst_ip, func.count(AnomalyResult.id).label("cnt"))
        .join(AnomalyResult, AnomalyResult.traffic_record_id == TrafficRecord.id)
        .filter(AnomalyResult.created_at >= since, AnomalyResult.is_anomaly == 1)
        .group_by(TrafficRecord.dst_ip)
        .order_by(func.count(AnomalyResult.id).desc())
        .limit(5)
        .all()
    )
    top_targets = [{"ip": ip, "count": c} for ip, c in top_targets_rows]

    # --- Alert trend per day: SQL GROUP BY on date ---
    daily_counts = dict(
        db.query(func.date(Alert.created_at), func.count(Alert.id))
        .filter(Alert.created_at >= since)
        .group_by(func.date(Alert.created_at))
        .all()
    )
    buckets = {}
    now = datetime.utcnow()
    for i in range(days - 1, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_label = day_date.strftime("%b %d")
        buckets[day_label] = daily_counts.get(day_date, 0)
    alert_trend = [{"day": k, "count": v} for k, v in buckets.items()]

    # --- Latest model performance: single row lookup, already fast ---
    latest_run = (
        db.query(DetectionModelRun)
        .order_by(DetectionModelRun.trained_at.desc())
        .first()
    )
    model_performance = None
    if latest_run:
        model_performance = {
            "model_name": latest_run.model_name,
            "dataset_used": latest_run.dataset_used,
            "accuracy": latest_run.accuracy,
            "precision": latest_run.precision,
            "recall": latest_run.recall,
            "f1_score": latest_run.f1_score,
            "trained_at": latest_run.trained_at,
        }

    return {
        "period_days": days,
        "generated_at": datetime.utcnow(),
        "alerts": {
            "total": total_alerts,
            "resolved": resolved_count,
            "false_positive": false_positive_count,
            "severity_breakdown": severity_counts,
            "status_breakdown": status_breakdown,
            "trend": alert_trend,
        },
        "detection": {
            "total_scored": total_scored,
            "total_anomalies": total_anomalies,
            "avg_risk_score": avg_risk_score,
            "attack_type_breakdown": attack_breakdown,
        },
        "top_attackers": top_attackers,
        "top_targets": top_targets,
        "model_performance": model_performance,
    }