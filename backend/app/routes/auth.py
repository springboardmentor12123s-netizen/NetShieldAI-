from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.utils.auth import get_current_user

from app.database import SessionLocal
from app.schemas.user_schema import UserCreate
from app.schemas.login_schema import LoginRequest

from app.services.auth_service import (
    register_user,
    login_user,
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user
)

router = APIRouter()


# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Register API
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = register_user(db, user)

    if new_user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    return new_user


# Login API
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    token = login_user(
        db=db,
        email=form_data.username,
        password=form_data.password
    )

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return token


# Protected Profile API
@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }


# Get All Users API
@router.get("/users")
def users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_all_users(db)

@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/users/{user_id}")
def update_existing_user(
    user_id: int,
    updated_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = update_user(db, user_id, updated_data)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.delete("/users/{user_id}")
def delete_existing_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    success = delete_user(db, user_id)

    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "User deleted successfully"
    }