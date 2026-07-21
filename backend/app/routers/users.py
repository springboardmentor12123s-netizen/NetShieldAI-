"""
User Management Module: team management + audit log listing.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Team, UserRole
from app.models.audit_log import AuditLog
from app.schemas.user import UserOut, TeamCreate, TeamOut
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api", tags=["User & Team Management"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/teams", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Team).all()


@router.post("/teams", response_model=TeamOut)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN, UserRole.SOC_LEAD)),
):
    team = Team(name=payload.name, description=payload.description)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN, UserRole.SOC_LEAD)),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        for log in logs
    ]
