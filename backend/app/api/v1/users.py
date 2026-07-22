"""NetShield AI - Users API Routes."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, require_roles
from app.services.user_service import UserService
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserProfileUpdate,
    UserResponse,
    UserListResponse,
    ChangePasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.common import APIResponse, PaginatedResponse, MessageResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserListResponse])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role_id: Optional[UUID] = None,
    team_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """List all users with pagination, filters, and dynamic sorting (Admin only)."""
    service = UserService(db)
    users, total = await service.list_users(
        page, per_page, search, role_id, team_id, is_active, sort_by, sort_order
    )
    return PaginatedResponse.create(users, total, page, per_page)


@router.post("", response_model=APIResponse[UserResponse], status_code=201)
async def create_user(
    data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Create a new user (Admin only)."""
    service = UserService(db)
    user = await service.create_user(
        data,
        created_by=UUID(current_user["user_id"]),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse(data=user)


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_current_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get current user's profile."""
    service = UserService(db)
    user = await service.get_user(UUID(current_user["user_id"]))
    return APIResponse(data=user)


@router.put("/me", response_model=APIResponse[UserResponse])
async def update_current_profile(
    data: UserProfileUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update current user's own profile."""
    service = UserService(db)
    user = await service.update_profile(
        UUID(current_user["user_id"]),
        data,
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse(data=user)


@router.patch("/me/password", response_model=MessageResponse)
async def change_current_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Change current logged-in user password."""
    service = UserService(db)
    await service.change_password(
        user_id=UUID(current_user["user_id"]),
        current_password=data.current_password,
        new_password=data.new_password,
    )
    return MessageResponse(message="Password updated successfully")


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
async def get_user_by_id(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Get user by ID (Admin only)."""
    service = UserService(db)
    user = await service.get_user(user_id)
    return APIResponse(data=user)


@router.put("/{user_id}", response_model=APIResponse[UserResponse])
async def update_user_by_id(
    user_id: UUID,
    data: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Update user by ID (Admin only)."""
    service = UserService(db)
    user = await service.update_user(
        user_id,
        data,
        updated_by=UUID(current_user["user_id"]),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse(data=user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: UUID,
    request: Request,
    hard: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Delete user (Admin only). Soft delete by default. Pass `hard=true` for row deletion."""
    service = UserService(db)
    operator_id = UUID(current_user["user_id"])
    ip = request.client.host if request.client else None

    if hard:
        await service.delete_user(user_id, deleted_by=operator_id, ip_address=ip)
        msg = "User permanently deleted"
    else:
        await service.soft_delete_user(user_id, deleted_by=operator_id, ip_address=ip)
        msg = "User soft-deleted successfully"

    return MessageResponse(message=msg)


@router.patch("/{user_id}/activate", response_model=APIResponse[UserResponse])
async def activate_user(
    user_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Activate user account (Admin only)."""
    service = UserService(db)
    user = await service.activate_user(
        user_id,
        activated_by=UUID(current_user["user_id"]),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse(data=user)


@router.patch("/{user_id}/deactivate", response_model=APIResponse[UserResponse])
async def deactivate_user(
    user_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Deactivate user account (Admin only)."""
    service = UserService(db)
    user = await service.deactivate_user(
        user_id,
        deactivated_by=UUID(current_user["user_id"]),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse(data=user)


@router.post("/{user_id}/reset-password", response_model=MessageResponse)
async def reset_user_password(
    user_id: UUID,
    data: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Force reset user password by admin (Admin only)."""
    service = UserService(db)
    await service.reset_password(
        user_id=user_id,
        new_password=data.new_password,
        reset_by=UUID(current_user["user_id"]),
        ip_address=request.client.host if request.client else None,
    )
    return MessageResponse(message="User password reset successfully")


@router.patch("/{user_id}/role", response_model=APIResponse[UserResponse])
async def assign_user_role(
    user_id: UUID,
    request: Request,
    role_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Assign role to user (Admin only)."""
    service = UserService(db)
    user = await service.assign_role(
        user_id=user_id,
        role_id=role_id,
        assigned_by=UUID(current_user["user_id"]),
        ip_address=request.client.host if request.client else None,
    )
    return APIResponse(data=user)
