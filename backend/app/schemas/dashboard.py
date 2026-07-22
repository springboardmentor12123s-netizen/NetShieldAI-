"""NetShield AI - Dashboard Schemas."""

from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime


class DashboardStats(BaseModel):
    """Main dashboard statistics."""
    total_traffic: int = 0
    today_alerts: int = 0
    risk_score: float = 0.0
    active_users: int = 0
    total_packets: int = 0
    bandwidth_mbps: float = 0.0
    connected_devices: int = 0
    threat_severity: Dict[str, int] = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    top_attacked_ports: List[Dict[str, Any]] = []
    top_protocols: List[Dict[str, Any]] = []
    packet_rate: float = 0.0


class SystemHealthResponse(BaseModel):
    """System health status."""
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    disk_usage: float = 0.0
    uptime_seconds: int = 0


class RecentActivityItem(BaseModel):
    """Single recent activity entry."""
    id: str
    type: str
    description: str
    user: Optional[str] = None
    timestamp: datetime
    severity: Optional[str] = None


class DashboardRecentActivity(BaseModel):
    """Dashboard recent activity feed."""
    activities: List[RecentActivityItem] = []
    total: int = 0
