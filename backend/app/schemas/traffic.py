"""NetShield AI - Traffic Schemas (MongoDB)."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TrafficLogResponse(BaseModel):
    """Traffic log entry response."""
    id: str
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    bytes_sent: int = 0
    bytes_received: int = 0
    packet_count: int = 0
    flags: List[str] = []
    duration_ms: int = 0
    geo: Optional[Dict[str, str]] = None
    metadata: Optional[Dict[str, Any]] = None


class TrafficFilter(BaseModel):
    """Traffic log filter parameters."""
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    protocol: Optional[str] = None
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    min_bytes: Optional[int] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class TrafficStatsResponse(BaseModel):
    """Aggregated traffic statistics."""
    total_packets: int = 0
    total_bytes: int = 0
    unique_sources: int = 0
    unique_destinations: int = 0
    protocol_distribution: Dict[str, int] = {}
    avg_packet_size: float = 0.0
    packets_per_second: float = 0.0
    bandwidth_mbps: float = 0.0


class TrafficAnalyticsResponse(BaseModel):
    """Traffic analytics aggregations for charts."""
    packets_per_second: List[Dict[str, Any]] = []
    protocol_distribution: List[Dict[str, Any]] = []
    bandwidth_usage: List[Dict[str, Any]] = []
    traffic_timeline: List[Dict[str, Any]] = []
    top_source_ips: List[Dict[str, Any]] = []
    top_destination_ips: List[Dict[str, Any]] = []


class TrafficIngestRequest(BaseModel):
    """Batch traffic ingestion request."""
    packets: List[Dict[str, Any]]
