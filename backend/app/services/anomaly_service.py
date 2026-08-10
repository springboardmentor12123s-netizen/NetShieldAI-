from sqlalchemy.orm import Session

from app.models.anomaly import Anomaly
from app.models.user import User
from app.schemas.anomaly_schema import AnomalyCreate
from app.services.email_service import send_email


CRITICAL_ATTACK_SUBJECT = "Critical Network Attack Detected"


def is_critical_anomaly(anomaly: Anomaly):
    return (
        anomaly.severity.upper() == "HIGH"
        or anomaly.confidence_score >= 0.90
    )


def build_critical_attack_email_body(anomaly: Anomaly):

    confidence_percent = round(anomaly.confidence_score * 100, 2)

    return f"""
Critical network attack detected.

Attack Type: {anomaly.anomaly_type}
Confidence: {confidence_percent}%
Severity: {anomaly.severity}
Source IP: {anomaly.source_ip}
Destination IP: {anomaly.destination_ip}
Protocol: {anomaly.protocol}
Detection Time: {anomaly.created_at}

Immediate investigation is recommended to verify the attack, contain any affected systems, and review related network activity.
"""


def send_critical_attack_alert(db: Session, anomaly: Anomaly):

    if anomaly.email_sent:
        return

    if not is_critical_anomaly(anomaly):
        return

    print("Critical attack detected")

    super_admins = (
        db.query(User)
        .filter(
            User.role == "SUPER_ADMIN",
            User.is_active.is_(True),
        )
        .all()
    )

    if not super_admins:
        print("No active SUPER_ADMIN users found for critical attack email.")
        return

    body = build_critical_attack_email_body(anomaly)
    email_sent = True

    for user in super_admins:

        print(f"Sending email to {user.email}")

        try:
            success = send_email(
                receiver=user.email,
                subject=CRITICAL_ATTACK_SUBJECT,
                body=body,
            )

            if success:
                print(f"Email sent successfully to {user.email}")
            else:
                email_sent = False
                print(f"Email failed for {user.email}")

        except Exception as e:
            email_sent = False
            print(f"Email failed for {user.email}: {e}")

    if email_sent:
        anomaly.email_sent = True
        db.commit()


def create_anomaly(db: Session, anomaly: AnomalyCreate):

    new_anomaly = Anomaly(
        source_ip=anomaly.source_ip,
        destination_ip=anomaly.destination_ip,
        anomaly_type=anomaly.anomaly_type,
        confidence_score=anomaly.confidence_score,
        severity=anomaly.severity,
        protocol=anomaly.protocol,
        status=anomaly.status
    )

    db.add(new_anomaly)
    db.commit()
    db.refresh(new_anomaly)

    try:
        send_critical_attack_alert(db, new_anomaly)
        db.refresh(new_anomaly)

    except Exception as e:
        print("Email failed:", e)

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
