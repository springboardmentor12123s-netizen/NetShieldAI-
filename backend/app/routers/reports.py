from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import NetworkTraffic

router = APIRouter()


@router.get("/summary")
def report_summary(db: Session = Depends(get_db)):

    total_records = db.query(NetworkTraffic).count()

    benign = db.query(NetworkTraffic).filter(
        NetworkTraffic.label == "BENIGN"
    ).count()

    attacks = total_records - benign

    attack_counts = (
        db.query(
            NetworkTraffic.label,
            func.count(NetworkTraffic.id)
        )
        .group_by(NetworkTraffic.label)
        .all()
    )

    threat_level = {
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

    risk_scores = {
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

    low = medium = high = critical = 0
    total_risk = 0

    for label, count in attack_counts:

        level = threat_level.get(label, "LOW")

        if level == "LOW":
            low += count
        elif level == "MEDIUM":
            medium += count
        elif level == "HIGH":
            high += count
        elif level == "CRITICAL":
            critical += count

        total_risk += risk_scores.get(label, 0) * count

    average_risk = (
        round(total_risk / total_records, 2)
        if total_records > 0
        else 0
    )

    return {
        "total_records": total_records,
        "benign": benign,
        "attacks": attacks,
        "low": low,
        "medium": medium,
        "high": high,
        "critical": critical,
        "average_risk_score": average_risk
    }