"""NetShield AI - System Schemas."""

from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
    uptime_seconds: int = 0
    timestamp: datetime


class ReadinessCheckResponse(BaseModel):
    """Readiness check response."""
    status: str
    checks: Dict[str, Dict[str, object]]
    timestamp: datetime


class MetricsResponse(BaseModel):
    """System metrics response."""
    total_requests: int = 0
    active_connections: int = 0
    average_response_time_ms: float = 0.0
    error_rate: float = 0.0
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    disk_usage: float = 0.0
