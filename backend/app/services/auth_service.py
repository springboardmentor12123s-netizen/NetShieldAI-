from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import FRONTEND_URL
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.services.email_service import send_email
from app.utils.password import hash_password, verify_password
from app.utils.jwt_handler import create_access_token


PASSWORD_RESET_RESPONSE = "If an account exists, a reset email has been sent."
PASSWORD_RESET_EXPIRY_MINUTES = 30


def hash_reset_token(token: str):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def register_user(db: Session, user: UserCreate):

    from app.utils.password_generator import generate_password

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        return None

    temp_password = generate_password()

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(temp_password),
        role=user.role.upper(),
        is_active=True,
        is_first_login=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    body = f"""
Hello {user.full_name},

A NetShield AI administrator account has been created for you.

Login URL:
http://localhost:5173/login

Email:
{user.email}

Temporary Password:
{temp_password}

For security reasons, you will be required to change your password after your first login.

Regards,

NetShield AI
"""

    send_email(
        receiver=user.email,
        subject="NetShield AI - Admin Account Created",
        body=body,
    )

    return new_user


def login_user(db: Session, email: str, password: str):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.password):
        return None

    user.last_login = datetime.utcnow()

    db.commit()

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
        }
    )

    return {
    "access_token": access_token,
    "token_type": "bearer",
    "first_login": user.is_first_login,
    }


def get_all_users(db: Session):

    return db.query(User).order_by(User.id).all()


def get_user_by_id(db: Session, user_id: int):

    return (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )


def update_user(
    db: Session,
    user_id: int,
    updated_data: dict,
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        return None

    for key, value in updated_data.items():

        if value is None:
            continue

        if key == "password":
            value = hash_password(value)

        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user


def update_profile(
    db: Session,
    user: User,
    full_name: str,
    email: str,
):

    db_user = (
        db.query(User)
        .filter(User.id == user.id)
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    existing_user = (
        db.query(User)
        .filter(
            User.email == email,
            User.id != user.id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists."
        )

    db_user.full_name = full_name
    db_user.email = email

    db.commit()
    db.refresh(db_user)

    return db_user


def delete_user(
    db: Session,
    user_id: int,
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        return False

    db.delete(user)
    db.commit()

    return True


def forgot_password(db: Session, email: str):

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None or not user.is_active:
        return {
            "message": PASSWORD_RESET_RESPONSE
        }

    token = secrets.token_urlsafe(32)
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    user.password_reset_token = hash_reset_token(token)
    user.password_reset_expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=PASSWORD_RESET_EXPIRY_MINUTES)
        )

    db.commit()

    body = f"""
Hello,

A password reset request was received for your NetShield AI account.

Click the link below to reset your password.

{reset_link}

This link expires in 30 minutes.

If you did not request this password reset, simply ignore this email.

Regards,
NetShield AI
"""

    try:
        send_email(
            receiver=user.email,
            subject="Password Reset Request",
            body=body,
        )

    except Exception as e:
        print("Password reset email failed:", e)

    return {
        "message": PASSWORD_RESET_RESPONSE
    }


def reset_password(
    db: Session,
    token: str,
    new_password: str,
):

    token_hash = hash_reset_token(token)

    user = (
        db.query(User)
        .filter(User.password_reset_token == token_hash)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token."
        )

    if user.password_reset_expires_at is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token."
            )
    expires_at = user.password_reset_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
            )
    if expires_at < datetime.now(timezone.utc):
        user.password_reset_token = None
        user.password_reset_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token."
            )

    user.password = hash_password(new_password)
    user.is_first_login = False
    user.password_reset_token = None
    user.password_reset_expires_at = None

    db.commit()

    return {
        "message": "Password reset successfully."
    }


def change_password(
    db: Session,
    user: User,
    old_password: str,
    new_password: str,
):

    db_user = (
        db.query(User)
        .filter(User.id == user.id)
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if not verify_password(old_password, db_user.password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect."
        )

    db_user.password = hash_password(new_password)

    db_user.is_first_login = False

    db.commit()

    return {
        "message": "Password changed successfully."
    }
