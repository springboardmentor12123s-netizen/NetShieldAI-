from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Form, HTTPException, status
from pydantic import ValidationError

from app.auth import (
    create_access_token,
    create_reset_token,
    decode_reset_token,
    hash_password,
    verify_password,
)
from app.config import settings
from app.database import log_audit, password_resets_collection, users_collection
from app.models import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserOut,
    password_strength,
)
from app.services.email_service import send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    existing_username = await users_collection.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")

    existing_email = await users_collection.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # First registered user becomes admin so there's always at least one admin account.
    user_count = await users_collection.count_documents({})
    role = "admin" if user_count == 0 else "security_analyst"

    doc = {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hash_password(user.password),
        "role": role,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    await users_collection.insert_one(doc)
    return UserOut(username=user.username, email=user.email, full_name=user.full_name, role=role, is_active=True)


@router.get("/password-strength")
async def check_password_strength(password: str):
    """Backs the frontend's live password strength meter."""
    return password_strength(password)


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    remember_me: bool = Form(False),
):
    user = await users_collection.find_one({"username": username})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been disabled. Contact an administrator.")

    token = create_access_token({"sub": user["username"], "role": user.get("role", "security_analyst")}, remember_me=remember_me)
    return Token(access_token=token)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user = await users_collection.find_one({"email": payload.email})
    # Always return the same generic response, whether or not the email exists,
    # so the endpoint can't be used to enumerate registered accounts.
    generic_response = {"message": "If that email is registered, a password reset link has been sent."}
    if not user:
        return generic_response

    token = create_reset_token(payload.email)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.reset_token_expire_minutes)
    await password_resets_collection.insert_one(
        {
            "email": payload.email,
            "token": token,
            "used": False,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at,
        }
    )
    reset_link = f"{settings.frontend_base_url.rstrip('/')}/reset-password?token={token}"
    await send_password_reset_email(
        payload.email, reset_link, settings.reset_token_expire_minutes
    )
    await log_audit("password_reset_requested", payload.email, {"expires_at": expires_at.isoformat()})
    return generic_response


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    email = decode_reset_token(payload.token)

    record = await password_resets_collection.find_one({"token": payload.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has already been used")

    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid")

    await users_collection.update_one(
        {"email": email}, {"$set": {"hashed_password": hash_password(payload.new_password)}}
    )
    await password_resets_collection.update_one({"token": payload.token}, {"$set": {"used": True}})
    await log_audit("password_reset_completed", email)
    return {"message": "Password has been reset successfully. You can now log in."}
