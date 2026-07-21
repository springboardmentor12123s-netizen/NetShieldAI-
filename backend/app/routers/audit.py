from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import AuditLog
from app.schemas.audit import AuditLogResponse
from app.utils.permissions import require_role

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"]
)


@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin"]))
):

    logs = db.query(AuditLog).all()

    return logs