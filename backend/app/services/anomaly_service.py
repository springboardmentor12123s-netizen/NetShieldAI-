from sqlalchemy.orm import Session

from app.models.anomaly import Anomaly
from app.schemas.anomaly_schema import AnomalyCreate


def create_anomaly(db: Session, anomaly: AnomalyCreate):

    new_anomaly = Anomaly(
        source_ip=anomaly.source_ip,
        destination_ip=anomaly.destination_ip,
        anomaly_type=anomaly.anomaly_type,
        confidence_score=anomaly.confidence_score,
        status=anomaly.status
    )

    db.add(new_anomaly)
    db.commit()
    db.refresh(new_anomaly)

    return new_anomaly


def get_all_anomalies(db: Session):
    return (
        db.query(Anomaly)
        .order_by(Anomaly.id.desc())
        .limit(200)
        .all()
    )

def get_anomaly_by_id(db: Session, anomaly_id: int):
    return db.query(Anomaly).filter(
        Anomaly.id == anomaly_id
    ).first()


def delete_anomaly(db: Session, anomaly_id: int):

    anomaly = db.query(Anomaly).filter(
        Anomaly.id == anomaly_id
    ).first()

    if anomaly is None:
        return False

    db.delete(anomaly)
    db.commit()

    return True
