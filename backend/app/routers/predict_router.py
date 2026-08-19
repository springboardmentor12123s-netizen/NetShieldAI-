from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.config import settings
from app.database import alerts_collection, predictions_collection, users_collection
from app.ml.model import predict_traffic
from app.models import PredictionRequest
from app.services.email_service import send_critical_alert_email

router = APIRouter(prefix="/api/predict", tags=["prediction"])

SEVERITY_THRESHOLDS = [
    (90, "critical"),
    (70, "high"),
    (40, "medium"),
    (0, "low"),
]

RECOMMENDATIONS = {
    "ddos": "Block source IP and enable rate limiting",
    "portscan": "Block source IP and review firewall rules",
    "bruteforce": "Lock account and block source IP",
    "botnet": "Isolate host and block source IP",
}


def severity_for(score: float) -> str:
    for threshold, label in SEVERITY_THRESHOLDS:
        if score >= threshold:
            return label
    return "low"


@router.post("")
async def predict(payload: PredictionRequest, current_user=Depends(get_current_user)):
    """Milestone 2: run the AI model on a packet/flow and get risk + attack type,
    with confidence, threat level, and recommended actions."""
    result = predict_traffic(payload.model_dump())

    doc = {
        "prediction_id": result["prediction_id"],
        "source_ip": payload.source_ip,
        "destination_ip": payload.destination_ip,
        "is_attack": result["is_attack"],
        "attack_type": result["attack_type"],
        "confidence": result["confidence"],
        "risk_score": result["risk_score"],
        "threat_level": result["threat_level"],
        "recommended_actions": result["recommended_actions"],
        "created_at": result["timestamp"],
    }
    await predictions_collection.insert_one(doc)

    # Milestone 3: auto-generate an alert for attacks
    if result["is_attack"]:
        severity = severity_for(result["risk_score"])
        alert_doc = {
            "source_ip": payload.source_ip,
            "destination_ip": payload.destination_ip,
            "attack_type": result["attack_type"],
            "risk_score": result["risk_score"],
            "severity": severity,
            "recommendation": RECOMMENDATIONS.get(result["attack_type"], "Investigate and block source IP"),
            "resolved": False,
            "false_positive": False,
            "created_at": result["timestamp"],
        }
        await alerts_collection.insert_one(alert_doc)

        # Feature 3: automatic email alert for critical attacks
        is_critical = severity == "critical" or result["risk_score"] >= settings.critical_alert_risk_threshold
        if settings.critical_alerts_enabled and is_critical:
            recipient = settings.security_team_email or None
            if not recipient:
                admin = await users_collection.find_one({"role": "admin", "email": {"$ne": None}})
                recipient = admin["email"] if admin else None
            if recipient:
                await send_critical_alert_email(
                    recipient,
                    attack_type=result["attack_type"],
                    source_ip=payload.source_ip,
                    destination_ip=payload.destination_ip or "N/A",
                    risk_score=result["risk_score"],
                    confidence=result["confidence"],
                    severity=severity,
                    timestamp=result["timestamp"].isoformat(),
                    recommended_actions=result["recommended_actions"],
                )

    return {
        "source_ip": payload.source_ip,
        **result,
    }
