"""NetShield AI - Auth API Routes."""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest, LoginResponse, RefreshRequest, RefreshResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
)
from app.schemas.common import APIResponse, MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=APIResponse[LoginResponse])
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    service = AuthService(db)
    result = await service.login(
        email=data.email,
        password=data.password,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return APIResponse(data=result)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout user and invalidate tokens."""
    service = AuthService(db)
    await service.logout(
        jti=current_user["jti"],
        user_id=current_user["user_id"],
        ip_address=request.client.host if request.client else None,
    )
    return MessageResponse(message="Logged out successfully")


@router.post("/refresh", response_model=APIResponse[RefreshResponse])
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token rotation."""
    service = AuthService(db)
    result = await service.refresh_tokens(data.refresh_token)
    return APIResponse(data=result)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(data: ForgotPasswordRequest):
    """Request password reset (structure only - email sending in Part 2)."""
    return ForgotPasswordResponse()
