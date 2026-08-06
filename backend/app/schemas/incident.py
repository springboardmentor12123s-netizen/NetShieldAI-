"""NetShield AI - Incident Schemas."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.schemas.user import UserResponse


class IncidentBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    severity: str = Field(..., description="low, medium, high, critical")


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    resolution_notes: Optional[str] = None


class IncidentResponse(IncidentBase):
    id: UUID
    status: str
    assigned_to_id: Optional[UUID] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class IncidentAssign(BaseModel):
    assigned_to_id: Optional[UUID] = None
