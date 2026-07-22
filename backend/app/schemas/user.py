"""NetShield AI - User Schemas."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Shared user fields."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=12)
    role_id: UUID
    team_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
    role_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class UserProfileUpdate(BaseModel):
    """Schema for user self-profile update."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """Request schema for self password change."""
    current_password: str = Field(..., min_length=12)
    new_password: str = Field(..., min_length=12)


class ResetPasswordRequest(BaseModel):
    """Request schema for admin resetting a user's password."""
    new_password: str = Field(..., min_length=12)


class UserResponse(BaseModel):
    """User response schema."""
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role_id: UUID
    role_name: Optional[str] = None
    team_id: Optional[UUID] = None
    team_name: Optional[str] = None
    is_active: bool
    is_locked: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """User list item (lighter than full response)."""
    id: UUID
    email: str
    full_name: str
    role_name: Optional[str] = None
    team_name: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
