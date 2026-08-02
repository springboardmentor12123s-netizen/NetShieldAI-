from sqlalchemy.orm import Session

from app.database.models import Alert


def create_alert(
    db: Session,
    source_ip: str,
    destination_ip: str,
    protocol: str,
    attack_type: str,
    severity: str,
):
    """
    Save a detected attack as an alert.
    Avoid creating duplicate OPEN alerts.
    """

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.source_ip == source_ip,
            Alert.destination_ip == destination_ip,
            Alert.attack_type == attack_type,
            Alert.status == "OPEN",
        )
        .first()
    )

    if existing_alert:
        return existing_alert

    alert = Alert(
        source_ip=source_ip,
        destination_ip=destination_ip,
        protocol=protocol,
        attack_type=attack_type,
        severity=severity,
        status="OPEN",
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert