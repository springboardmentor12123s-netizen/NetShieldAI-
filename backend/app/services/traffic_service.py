"""NetShield AI - Traffic Service."""

import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.traffic_repository import TrafficRepository
from app.schemas.traffic import TrafficLogResponse, TrafficStatsResponse, TrafficAnalyticsResponse
from app.ai.prediction.predictor import ThreatPredictor
from app.core.redis import RedisManager


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
        alerts_to_insert = []
        redis_payloads = []

        for packet in packets:
            pred = predictor.predict_log(packet)
            packet["metadata"] = packet.get("metadata") or {}
            packet["metadata"].update({
                "is_anomaly": pred["is_anomaly"],
                "anomaly_score": pred["anomaly_score"],
                "threat_category": pred["predicted_label"],
                "risk_score": pred["risk_score"]
            })

            # Check if anomaly or threat predicted (not normal log)
            is_threat = pred["predicted_label"] not in ("Normal", "Normal (Error Fallback)")
            if pred["is_anomaly"] or is_threat:
                alert_id = str(uuid.uuid4())
                
                # Determine severity from risk score
                risk = pred["risk_score"]
                if risk > 0.8:
                    severity = "critical"
                elif risk > 0.6:
                    severity = "high"
                elif risk > 0.3:
                    severity = "medium"
                else:
                    severity = "low"
                
                alert_doc = {
                    "_id": alert_id,
                    "severity": severity,
                    "alert_type": pred["predicted_label"] or "Anomaly",
                    "source_ip": packet.get("src_ip"),
                    "dest_ip": packet.get("dst_ip"),
                    "description": f"AI identified {pred['predicted_label']} anomaly from {packet.get('src_ip')} to {packet.get('dst_ip')} with score {pred['anomaly_score']:.3f}",
                    "timestamp": datetime.now(timezone.utc),
                    "metadata": {
                        "anomaly_score": pred["anomaly_score"],
                        "risk_score": pred["risk_score"],
                        "protocol": packet.get("protocol"),
                        "sensor_id": packet.get("metadata", {}).get("sensor_id")
                    }
                }
                alerts_to_insert.append(alert_doc)
                
                # Alert notification payload for active listeners
                # Map to both flat WebSocket format and standard backend keys
                redis_payloads.append({
                    "id": alert_id,
                    "timestamp": alert_doc["timestamp"].isoformat(),
                    "description": alert_doc["description"],
                    "severity": alert_doc["severity"],
                    "source_ip": alert_doc["source_ip"],
                    "alert_type": alert_doc["alert_type"]
                })
        
        # Save generated alerts to database
        if alerts_to_insert:
            await self.traffic_repo.db["alerts"].insert_many(alerts_to_insert)
            
            # Broadcast alerts via Redis channel
            if await RedisManager.is_available():
                try:
                    redis_client = RedisManager.get_client()
                    for payload in redis_payloads:
                        await redis_client.publish("alerts", json.dumps(payload))
                except Exception as e:
                    print(f"Error publishing alerts to Redis: {e}")

        return await self.traffic_repo.insert_batch(packets)

    async def get_total_count(self) -> int:
        return await self.traffic_repo.get_total_count()

