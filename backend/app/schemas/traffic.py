from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TrafficRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    timestamp: datetime
    src_ip: str
    dst_ip: str
    src_port: Optional[int] = None
    dst_port: Optional[int] = None
    protocol: str
    duration: float
    packet_count: int
    byte_count: int
    dst_packet_count: int = 0
    dst_byte_count: int = 0
    packets_per_second: float
    bytes_per_second: float
    avg_packet_size: float
    tcp_flags: Optional[str] = None
    is_processed: bool
    source: str


class TrafficStats(BaseModel):
    total_flows: int
    total_bytes: int
    total_packets: int
    unique_src_ips: int
    unique_dst_ips: int
    protocol_breakdown: dict
    top_talkers: list
    flows_per_minute: list


class GenerateTrafficRequest(BaseModel):
    count: int = 200
    anomaly_ratio: float = 0.12  # fraction of flows that should look malicious