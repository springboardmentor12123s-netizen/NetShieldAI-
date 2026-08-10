from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas.user_schema import (
    UserCreate,
    ChangePassword,
    ForgotPassword,
    ProfileUpdate,
    ResetPassword,
)
from app.services.auth_service import (
    register_user,
    login_user,
    get_all_users,
    get_user_by_id,
    update_user,
    update_profile,
    delete_user,
    change_password,
    forgot_password,
    reset_password,
)
from app.utils.auth import get_current_user
from app.utils.jwt_handler import create_access_token

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only Super Admin can create admins.",
        )

    new_user = register_user(db, user)

    if new_user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    return new_user


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    token = login_user(
        db=db,
        email=form_data.username,
        password=form_data.password,
    )

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email/password or account disabled.",
        )

    return token


@router.get("/profile")
def profile(
    current_user=Depends(get_current_user),
):

    return current_user


@router.put("/profile")
def edit_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    user = update_profile(
        db=db,
        user=current_user,
        full_name=data.full_name,
        email=data.email,
    )

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
        }
    )

    return {
        "user": user,
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/forgot-password")
def request_password_reset(
    data: ForgotPassword,
    db: Session = Depends(get_db),
):

    return forgot_password(
        db=db,
        email=data.email,
    )


@router.post("/reset-password")
def reset_user_password(
    data: ResetPassword,
    db: Session = Depends(get_db),
):

    return reset_password(
        db=db,
        token=data.token,
        new_password=data.new_password,
    )


@router.get("/users")
def users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    return get_all_users(db)


@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    user = get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.put("/users/{user_id}")
def edit_user(
    user_id: int,
    updated_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    user = update_user(
        db,
        user_id,
        updated_data,
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.delete("/users/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete yourself.",
        )

    success = delete_user(
        db,
        user_id,
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "message": "User deleted successfully"
    }
@router.post("/change-password")
def change_my_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return change_password(
        db=db,
        user=current_user,
        old_password=data.old_password,
        new_password=data.new_password,
    )
