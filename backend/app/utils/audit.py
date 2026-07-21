"""Small helper to write AuditLog rows without repeating boilerplate everywhere."""
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(db: Session, user_id: str | None, action: str, details: str = "", ip_address: str = ""):
    entry = AuditLog(user_id=user_id, action=action, details=details, ip_address=ip_address)
    db.add(entry)
    db.commit()
