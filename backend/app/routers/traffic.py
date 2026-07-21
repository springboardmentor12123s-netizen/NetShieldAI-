"""
Network Monitoring Module.
Endpoints for packet/flow collection, traffic listing, and analytics
that power the Traffic Monitoring dashboard page.
"""
from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.traffic import TrafficRecord
from app.schemas.traffic import TrafficRecordOut, TrafficStats, GenerateTrafficRequest
from app.auth.dependencies import get_current_user
from app.ml.synthetic_traffic import generate_flows
from app.utils.audit import log_action

router = APIRouter(prefix="/api/traffic", tags=["Network Monitoring"])


@router.post("/generate", response_model=list[TrafficRecordOut])
def generate_traffic(
    payload: GenerateTrafficRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simulates packet capture (PCAP) / NetFlow ingestion.
    In production this would be replaced by a live Zeek/Wireshark feed writer.
    """
    flows = generate_flows(count=payload.count, anomaly_ratio=payload.anomaly_ratio)
    records = []
    for flow in flows:
        record = TrafficRecord(
            timestamp=flow["timestamp"],
            src_ip=flow["src_ip"],
            dst_ip=flow["dst_ip"],
            src_port=flow["src_port"],
            dst_port=flow["dst_port"],
            protocol=flow["protocol"],
            duration=flow["duration"],
            packet_count=flow["packet_count"],
            byte_count=flow["byte_count"],
            dst_packet_count=flow.get("dst_packet_count", 0),
            dst_byte_count=flow.get("dst_byte_count", 0),
            packets_per_second=flow["packets_per_second"],
            bytes_per_second=flow["bytes_per_second"],
            avg_packet_size=flow["avg_packet_size"],
            tcp_flags=flow["tcp_flags"],
            source="synthetic",
        )
        db.add(record)
        records.append(record)
    db.commit()
    for r in records:
        db.refresh(r)

    log_action(db, current_user.id, "TRAFFIC_GENERATED", f"Generated {len(records)} flow records")
    return records


@router.get("", response_model=list[TrafficRecordOut])
def list_traffic(
    limit: int = Query(100, le=1000),
    protocol: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TrafficRecord).order_by(TrafficRecord.timestamp.desc())
    if protocol:
        query = query.filter(TrafficRecord.protocol == protocol.upper())
    return query.limit(limit).all()


@router.get("/stats", response_model=TrafficStats)
def traffic_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(TrafficRecord).order_by(TrafficRecord.timestamp.desc()).limit(2000).all()

    total_bytes = sum(r.byte_count for r in records)
    total_packets = sum(r.packet_count for r in records)
    protocol_breakdown = dict(Counter(r.protocol for r in records))

    talker_bytes = Counter()
    for r in records:
        talker_bytes[r.src_ip] += r.byte_count
    top_talkers = [{"ip": ip, "bytes": b} for ip, b in talker_bytes.most_common(5)]

    # Bucket flows per minute for the last 30 minutes (traffic visualization line chart)
    buckets: dict[str, int] = {}
    now = datetime.utcnow()
    for i in range(30, -1, -1):
        bucket_time = (now - timedelta(minutes=i)).strftime("%H:%M")
        buckets[bucket_time] = 0
    for r in records:
        key = r.timestamp.strftime("%H:%M")
        if key in buckets:
            buckets[key] += 1
    flows_per_minute = [{"time": k, "count": v} for k, v in buckets.items()]

    return TrafficStats(
        total_flows=len(records),
        total_bytes=total_bytes,
        total_packets=total_packets,
        unique_src_ips=len({r.src_ip for r in records}),
        unique_dst_ips=len({r.dst_ip for r in records}),
        protocol_breakdown=protocol_breakdown,
        top_talkers=top_talkers,
        flows_per_minute=flows_per_minute,
    )