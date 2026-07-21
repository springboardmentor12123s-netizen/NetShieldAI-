"""
Aggregate summary endpoint powering the top-level dashboard cards.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.traffic import TrafficRecord
from app.models.anomaly import AnomalyResult
from app.models.alert import Alert, AlertStatus
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_flows = db.query(TrafficRecord).count()
    unprocessed = db.query(TrafficRecord).filter(TrafficRecord.is_processed == False).count()  # noqa: E712
    total_scored = db.query(AnomalyResult).count()
    total_anomalies = db.query(AnomalyResult).filter(AnomalyResult.is_anomaly == 1).count()
    open_alerts = db.query(Alert).filter(Alert.status == AlertStatus.OPEN).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "critical", Alert.status == AlertStatus.OPEN).count()

    avg_risk = db.query(AnomalyResult).all()
    avg_risk_score = round(sum(r.risk_score for r in avg_risk) / len(avg_risk), 2) if avg_risk else 0.0

    return {
        "total_flows": total_flows,
        "unprocessed_flows": unprocessed,
        "total_scored": total_scored,
        "total_anomalies": total_anomalies,
        "detection_rate": round((total_anomalies / total_scored) * 100, 2) if total_scored else 0.0,
        "open_alerts": open_alerts,
        "critical_alerts": critical_alerts,
        "avg_risk_score": avg_risk_score,
    }
