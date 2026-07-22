"""NetShield AI - Traffic Service."""

from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.traffic_repository import TrafficRepository
from app.schemas.traffic import TrafficLogResponse, TrafficStatsResponse, TrafficAnalyticsResponse
from app.ai.prediction.predictor import ThreatPredictor


class TrafficService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.traffic_repo = TrafficRepository(db)

    async def list_traffic(
        self, page: int = 1, per_page: int = 20,
        src_ip: Optional[str] = None, dst_ip: Optional[str] = None,
        protocol: Optional[str] = None, src_port: Optional[int] = None,
        dst_port: Optional[int] = None, start_time=None, end_time=None,
        search: Optional[str] = None,
    ) -> tuple[List[TrafficLogResponse], int]:
        skip = (page - 1) * per_page
        logs, total = await self.traffic_repo.get_paginated(
            skip=skip, limit=per_page, src_ip=src_ip, dst_ip=dst_ip,
            protocol=protocol, src_port=src_port, dst_port=dst_port,
            start_time=start_time, end_time=end_time, search=search,
        )
        items = [TrafficLogResponse(**log) for log in logs]
        return items, total

    async def get_stats(self, hours: int = 24) -> TrafficStatsResponse:
        stats = await self.traffic_repo.get_stats(hours)
        return TrafficStatsResponse(**stats)

    async def get_analytics(self, hours: int = 24) -> TrafficAnalyticsResponse:
        analytics = await self.traffic_repo.get_analytics(hours)
        return TrafficAnalyticsResponse(**analytics)

    async def ingest_packets(self, packets: List[Dict[str, Any]]) -> int:
        predictor = ThreatPredictor()
        for packet in packets:
            pred = predictor.predict_log(packet)
            packet["metadata"] = packet.get("metadata") or {}
            packet["metadata"].update({
                "is_anomaly": pred["is_anomaly"],
                "anomaly_score": pred["anomaly_score"],
                "threat_category": pred["predicted_label"],
                "risk_score": pred["risk_score"]
            })
        return await self.traffic_repo.insert_batch(packets)

    async def get_total_count(self) -> int:
        return await self.traffic_repo.get_total_count()

