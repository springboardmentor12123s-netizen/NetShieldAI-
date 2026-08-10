from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.anomaly import Anomaly


def get_analytics(db: Session):

    total = db.query(Anomaly).count()

    high_confidence = (
        db.query(Anomaly)
        .filter(Anomaly.confidence_score >= 0.9)
        .count()
    )

    average_confidence = (
        db.query(
            func.avg(Anomaly.confidence_score)
        ).scalar()
        or 0
    )

    attacks = (
        db.query(
            Anomaly.anomaly_type,
            func.count(Anomaly.id),
        )
        .group_by(Anomaly.anomaly_type)
        .all()
    )

    attack_distribution = []

    for attack, count in attacks:

        attack_distribution.append(
            {
                "attack": attack,
                "count": count,
            }
        )

    return {
        "total_predictions": total,
        "high_confidence": high_confidence,
        "average_confidence": round(float(average_confidence), 4),
        "attack_distribution": attack_distribution,
    }