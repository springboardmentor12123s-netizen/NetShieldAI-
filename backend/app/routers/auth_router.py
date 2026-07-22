from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.schemas.user_schema import UserLogin, UserRegister
from app.auth.auth import login
from app.database.database import get_db
from app.services.user_service import register_user

router = APIRouter()


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    new_user = register_user(db, user)

    if new_user is None:
        raise HTTPException(
            status_code=400,
            detail="Username or Email already exists"
        )

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):

    result = login(
        db,
        user.username,
        user.password
    )

    if result:
        return result

    raise HTTPException(
        status_code=401,
        detail="Invalid username or password"
    )