from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

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

    # --- Alerts summary ---
    alerts = db.query(Alert).filter(Alert.created_at >= since).all()
    severity_breakdown = dict(Counter(a.severity for a in alerts))
    status_breakdown = dict(Counter(a.status.value for a in alerts))
    total_alerts = len(alerts)
    resolved_count = sum(1 for a in alerts if a.status == AlertStatus.RESOLVED)
    false_positive_count = sum(1 for a in alerts if a.status == AlertStatus.FALSE_POSITIVE)

    # --- Anomaly / attack type summary ---
    results = db.query(AnomalyResult).filter(AnomalyResult.created_at >= since).all()
    total_scored = len(results)
    total_anomalies = sum(1 for r in results if r.is_anomaly == 1)
    attack_breakdown = dict(Counter(r.predicted_attack_type for r in results if r.predicted_attack_type != "benign"))
    avg_risk_score = round(sum(r.risk_score for r in results) / total_scored, 2) if total_scored else 0.0

    # --- Top attackers / targets (joined via traffic_record) ---
    src_counter = Counter()
    dst_counter = Counter()
    for r in results:
        if r.is_anomaly == 1 and r.traffic_record:
            src_counter[r.traffic_record.src_ip] += 1
            dst_counter[r.traffic_record.dst_ip] += 1

    top_attackers = [{"ip": ip, "count": c} for ip, c in src_counter.most_common(5)]
    top_targets = [{"ip": ip, "count": c} for ip, c in dst_counter.most_common(5)]

    # --- Alerts trend per day ---
    buckets: dict[str, int] = {}
    now = datetime.utcnow()
    for i in range(days - 1, -1, -1):
        day = (now - timedelta(days=i)).strftime("%b %d")
        buckets[day] = 0
    for a in alerts:
        key = a.created_at.strftime("%b %d")
        if key in buckets:
            buckets[key] += 1
    alert_trend = [{"day": k, "count": v} for k, v in buckets.items()]

    # --- Latest model performance ---
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
            "severity_breakdown": severity_breakdown,
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