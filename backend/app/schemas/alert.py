"""NetShield AI - Alert Schemas (MongoDB)."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AlertBase(BaseModel):
    severity: str = Field(..., description="low, medium, high, critical")
    alert_type: str = Field(..., description="E.g., anomaly, known_threat")
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    description: str
    incident_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: str
    timestamp: datetime


class AlertFilter(BaseModel):
    severity: Optional[str] = None
    alert_type: Optional[str] = None
    source_ip: Optional[str] = None
    incident_id: Optional[str] = None
    is_assigned: Optional[bool] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
