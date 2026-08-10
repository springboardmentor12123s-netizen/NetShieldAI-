from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.analytics_service import (
    get_analytics,
    
)
from app.utils.auth import get_current_user

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/analytics")
def analytics(
    db: Session = Depends(get_db),
):
    return get_analytics(db)


