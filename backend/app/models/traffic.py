"""
Network Monitoring Module
Stores flow-level records (packet capture / NetFlow style summaries)
used for traffic monitoring, protocol analysis, and as ML feature input.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean
from app.database import Base


class TrafficRecord(Base):
    __tablename__ = "traffic_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    src_ip = Column(String, nullable=False, index=True)
    dst_ip = Column(String, nullable=False, index=True)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    protocol = Column(String, nullable=False)   # TCP / UDP / ICMP

    duration = Column(Float, default=0.0)        # seconds
    packet_count = Column(Integer, default=0)
    byte_count = Column(Integer, default=0)
    dst_packet_count = Column(Integer, default=0)   # backward/destination-side packet count
    dst_byte_count = Column(Integer, default=0)      # backward/destination-side byte count
    packets_per_second = Column(Float, default=0.0)
    bytes_per_second = Column(Float, default=0.0)
    avg_packet_size = Column(Float, default=0.0)
    tcp_flags = Column(String, nullable=True)     # e.g. "SYN,ACK"

    # Denotes whether this flow has been scored by the AI pipeline yet
    is_processed = Column(Boolean, default=False, index=True)

    # Provenance: "synthetic", "cicids2017", "unsw-nb15", "live"
    source = Column(String, default="synthetic")
