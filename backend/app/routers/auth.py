from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utils.permissions import require_role
from app.database.database import get_db
from app.database.models import User, AuditLog
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# Register User
# -------------------------
@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# -------------------------
# Login User
# -------------------------
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    log = AuditLog(
        user_email=db_user.email,
        action="User Logged In"
    )

    db.add(log)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# -------------------------
# Current Logged-in User
# -------------------------
@router.get("/me")
def get_profile(
    current_user=Depends(
        require_role(["Admin", "Security Analyst"])
    ),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "Authenticated Successfully",
        "user": {
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }