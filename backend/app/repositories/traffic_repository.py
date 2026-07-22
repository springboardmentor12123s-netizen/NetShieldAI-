"""NetShield AI - Traffic Repository (MongoDB)."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId



class TrafficRepository:
    """Repository for MongoDB traffic log operations."""

    COLLECTION = "traffic_logs"

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[self.COLLECTION]

    async def get_paginated(
        self,
        skip: int = 0,
        limit: int = 20,
        src_ip: Optional[str] = None,
        dst_ip: Optional[str] = None,
        protocol: Optional[str] = None,
        src_port: Optional[int] = None,
        dst_port: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        search: Optional[str] = None,
    ) -> tuple[List[Dict[str, Any]], int]:
        """Get paginated traffic logs with filters."""
        query: Dict[str, Any] = {}

        if src_ip:
            query["src_ip"] = src_ip
        if dst_ip:
            query["dst_ip"] = dst_ip
        if protocol:
            query["protocol"] = protocol.upper()
        if src_port:
            query["src_port"] = src_port
        if dst_port:
            query["dst_port"] = dst_port
        if start_time or end_time:
            query["timestamp"] = {}
            if start_time:
                query["timestamp"]["$gte"] = start_time
            if end_time:
                query["timestamp"]["$lte"] = end_time
        if search:
            query["$or"] = [
                {"src_ip": {"$regex": search, "$options": "i"}},
                {"dst_ip": {"$regex": search, "$options": "i"}},
                {"protocol": {"$regex": search, "$options": "i"}},
            ]

        total = await self.collection.count_documents(query)
        cursor = self.collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        logs = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            logs.append(doc)

        return logs, total

    async def get_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get traffic statistics for the last N hours."""
        since = datetime.now(timezone.utc) - timedelta(hours=hours)

        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {
                "$group": {
                    "_id": None,
                    "total_packets": {"$sum": "$packet_count"},
                    "total_bytes": {"$sum": {"$add": ["$bytes_sent", "$bytes_received"]}},
                    "unique_sources": {"$addToSet": "$src_ip"},
                    "unique_destinations": {"$addToSet": "$dst_ip"},
                }
            },
        ]

        result = await self.collection.aggregate(pipeline).to_list(1)
        if not result:
            return {
                "total_packets": 0,
                "total_bytes": 0,
                "unique_sources": 0,
                "unique_destinations": 0,
                "protocol_distribution": {},
                "avg_packet_size": 0.0,
                "packets_per_second": 0.0,
                "bandwidth_mbps": 0.0,
            }

        data = result[0]
        total_bytes = data.get("total_bytes", 0)
        total_packets = data.get("total_packets", 0)

        # Protocol distribution
        proto_pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$protocol", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        proto_result = await self.collection.aggregate(proto_pipeline).to_list(20)
        protocol_dist = {p["_id"]: p["count"] for p in proto_result}

        return {
            "total_packets": total_packets,
            "total_bytes": total_bytes,
            "unique_sources": len(data.get("unique_sources", [])),
            "unique_destinations": len(data.get("unique_destinations", [])),
            "protocol_distribution": protocol_dist,
            "avg_packet_size": total_bytes / max(total_packets, 1),
            "packets_per_second": total_packets / (hours * 3600),
            "bandwidth_mbps": (total_bytes * 8) / (hours * 3600 * 1_000_000),
        }

    async def get_analytics(self, hours: int = 24) -> Dict[str, Any]:
        """Get traffic analytics for chart data."""
        since = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Traffic timeline (hourly)
        timeline_pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%dT%H:00:00Z", "date": "$timestamp"}
                    },
                    "packets": {"$sum": "$packet_count"},
                    "bytes": {"$sum": {"$add": ["$bytes_sent", "$bytes_received"]}},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        timeline = await self.collection.aggregate(timeline_pipeline).to_list(100)

        # Top source IPs
        top_src_pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$src_ip", "count": {"$sum": 1}, "bytes": {"$sum": "$bytes_sent"}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_sources = await self.collection.aggregate(top_src_pipeline).to_list(10)

        # Top destination IPs
        top_dst_pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$dst_ip", "count": {"$sum": 1}, "bytes": {"$sum": "$bytes_received"}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        top_destinations = await self.collection.aggregate(top_dst_pipeline).to_list(10)

        # Protocol distribution
        proto_pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {"_id": "$protocol", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        protocols = await self.collection.aggregate(proto_pipeline).to_list(20)

        # Bandwidth usage (hourly)
        bandwidth_pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%dT%H:00:00Z", "date": "$timestamp"}
                    },
                    "bytes": {"$sum": {"$add": ["$bytes_sent", "$bytes_received"]}},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        bandwidth = await self.collection.aggregate(bandwidth_pipeline).to_list(100)

        return {
            "traffic_timeline": [{"time": t["_id"], "packets": t["packets"], "bytes": t["bytes"]} for t in timeline],
            "top_source_ips": [{"ip": s["_id"], "count": s["count"], "bytes": s["bytes"]} for s in top_sources],
            "top_destination_ips": [{"ip": d["_id"], "count": d["count"], "bytes": d["bytes"]} for d in top_destinations],
            "protocol_distribution": [{"protocol": p["_id"], "count": p["count"]} for p in protocols],
            "bandwidth_usage": [{"time": b["_id"], "bytes": b["bytes"]} for b in bandwidth],
            "packets_per_second": [],
        }

    async def insert_batch(self, packets: List[Dict[str, Any]]) -> int:
        """Bulk insert traffic log entries."""
        if not packets:
            return 0
        for packet in packets:
            if "timestamp" not in packet:
                packet["timestamp"] = datetime.now(timezone.utc)
        result = await self.collection.insert_many(packets)
        return len(result.inserted_ids)

    async def get_total_count(self) -> int:
        """Get total traffic log count."""
        return await self.collection.count_documents({})
