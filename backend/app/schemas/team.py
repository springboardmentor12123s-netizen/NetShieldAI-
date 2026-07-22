"""NetShield AI - Team Schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class TeamBase(BaseModel):
    """Shared team fields."""
    name: str = Field(..., min_length=2, max_length=100)
    department: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class TeamCreate(TeamBase):
    """Create team request."""
    pass


class TeamUpdate(BaseModel):
    """Update team request."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TeamMemberAdd(BaseModel):
    """Add member to team request."""
    user_id: UUID
    role_in_team: str = Field(default="member", max_length=50)


class TeamMemberResponse(BaseModel):
    """Team member response."""
    id: UUID
    user_id: UUID
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    role_in_team: str
    joined_at: datetime

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    """Team response."""
    id: UUID
    name: str
    department: str
    description: Optional[str] = None
    is_active: bool
    member_count: int = 0
    members: List[TeamMemberResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    """Team list item."""
    id: UUID
    name: str
    department: str
    is_active: bool
    member_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
