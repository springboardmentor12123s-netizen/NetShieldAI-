"""NetShield AI - Role & Permission Schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class PermissionResponse(BaseModel):
    """Permission response."""
    id: UUID
    name: str
    resource: str
    action: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PermissionCreate(BaseModel):
    """Permission creation request schema."""
    name: str = Field(..., min_length=2, max_length=100)
    resource: str = Field(..., min_length=2, max_length=50)
    action: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None


class PermissionUpdate(BaseModel):
    """Permission update request schema."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    resource: Optional[str] = Field(None, min_length=2, max_length=50)
    action: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None


class RoleBase(BaseModel):
    """Shared role fields."""
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Create role request."""
    permission_ids: List[UUID] = []


class RoleUpdate(BaseModel):
    """Update role request."""
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = None
    permission_ids: Optional[List[UUID]] = None


class RoleResponse(BaseModel):
    """Role response."""
    id: UUID
    name: str
    description: Optional[str] = None
    is_system_role: bool
    permissions: List[PermissionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """Role list item."""
    id: UUID
    name: str
    description: Optional[str] = None
    is_system_role: bool
    user_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class RolePermissionMatrixEntry(BaseModel):
    """Entry explaining which roles map to what permissions."""
    role_id: UUID
    role_name: str
    permissions: List[str]
