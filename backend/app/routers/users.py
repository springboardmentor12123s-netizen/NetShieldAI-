from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.schemas.user import UserListResponse
from app.utils.permissions import require_role

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/", response_model=UserListResponse)
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin"]))
):

    users = db.query(User).all()

    return {
        "message": "All Users",
        "users": users
    }