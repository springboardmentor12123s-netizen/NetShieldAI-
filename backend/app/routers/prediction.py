from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import joblib
import pandas as pd

from app.database.database import get_db
from app.database.models import NetworkTraffic
from app.database.models import Alert
router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.join(BASE_DIR, "..", "ai")

model = joblib.load(os.path.join(AI_DIR, "model.pkl"))
encoder = joblib.load(os.path.join(AI_DIR, "label_encoder.pkl"))

# ----------------------------
# Threat Levels
# ----------------------------

THREAT_LEVEL = {
    "BENIGN": "LOW",
    "Bot": "MEDIUM",
    "FTP-Patator": "HIGH",
    "SSH-Patator": "HIGH",
    "PortScan": "HIGH",
    "DDoS": "CRITICAL",
    "DoS Hulk": "CRITICAL",
    "DoS GoldenEye": "CRITICAL",
    "DoS slowloris": "CRITICAL",
    "DoS Slowhttptest": "CRITICAL",
    "Heartbleed": "CRITICAL",
    "Infiltration": "CRITICAL",
    "Web Attack – Brute Force": "HIGH",
    "Web Attack – Sql Injection": "CRITICAL",
    "Web Attack – XSS": "HIGH"
}


# ----------------------------
# Risk Scores
# ----------------------------

RISK_SCORE = {
    "BENIGN": 0,
    "Bot": 40,
    "FTP-Patator": 60,
    "SSH-Patator": 65,
    "PortScan": 75,
    "DDoS": 95,
    "DoS Hulk": 95,
    "DoS GoldenEye": 90,
    "DoS slowloris": 90,
    "DoS Slowhttptest": 90,
    "Heartbleed": 100,
    "Infiltration": 100,
    "Web Attack – Brute Force": 80,
    "Web Attack – Sql Injection": 100,
    "Web Attack – XSS": 70
}


@router.get("/{traffic_id}")
def predict_attack(
    traffic_id: int,
    db: Session = Depends(get_db)
):

    traffic = (
        db.query(NetworkTraffic)
        .filter(NetworkTraffic.id == traffic_id)
        .first()
    )

    if not traffic:
        raise HTTPException(
            status_code=404,
            detail="Traffic record not found"
        )

    features = {
    "Destination Port": traffic.destination_port,
    "Flow Duration": traffic.flow_duration,
    "Total Fwd Packets": traffic.total_fwd_packets,
    "Total Backward Packets": traffic.total_backward_packets,
    "Total Length of Fwd Packets": traffic.total_length_fwd_packets,
    "Total Length of Bwd Packets": traffic.total_length_backward_packets,
    "Flow Bytes/s": traffic.flow_bytes_per_sec,
    "Flow Packets/s": traffic.flow_packets_per_sec
}

    df = pd.DataFrame([features])
    prediction = model.predict(df)[0]

    probabilities = model.predict_proba(df)[0]

    confidence = float(probabilities.max() * 100)

    predicted_attack = encoder.inverse_transform([prediction])[0]

    risk = RISK_SCORE.get(predicted_attack, 0)

    threat = THREAT_LEVEL.get(predicted_attack, "UNKNOWN")

    status = (
        "Normal Traffic"
        if predicted_attack == "BENIGN"
        else "Attack Detected"
    )
    if predicted_attack != "BENIGN":

        new_alert = Alert(
            attack_type=predicted_attack,
            severity=threat,
            confidence=confidence,
            source=f"Traffic ID: {traffic_id}",
            status="Open"
        )

        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

    return {

        "traffic_id": traffic_id,

        "actual_label": traffic.label,

        "predicted_label": predicted_attack,

        "status": status,

        "threat_level": threat,

        "risk_score": risk,
        "confidence": round(confidence, 2),
        "alert_created": predicted_attack != "BENIGN"


    }