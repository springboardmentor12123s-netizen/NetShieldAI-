"""NetShield AI - Threat Intelligence Reports API."""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone

from app.core.dependencies import get_current_user, require_roles
from app.core.mongodb import MongoDBManager

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/threat-intelligence", response_model=Dict[str, Any])
async def get_threat_intelligence_report(
    days: int = Query(7, ge=1, le=90),
    current_user: dict = Depends(require_roles(["admin", "security_analyst", "analyst"]))
):
    """Generate a summary report of recent threat intelligence and alerts."""
    db = MongoDBManager.get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Aggregation pipeline to group incidents by severity
    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": "$severity",
            "count": {"$sum": 1}
        }}
    ]
    
    severity_counts_cursor = db["alerts"].aggregate(pipeline)
    severity_counts = await severity_counts_cursor.to_list(length=None)
    
    # Aggregation for top targeted destination IPs
    top_targets_pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}, "dest_ip": {"$ne": None}}},
        {"$group": {
            "_id": "$dest_ip",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    targets_cursor = db["alerts"].aggregate(top_targets_pipeline)
    top_targets = await targets_cursor.to_list(length=5)

    return {
        "report_generated_at": datetime.now(timezone.utc),
        "timeframe_days": days,
        "total_alerts_by_severity": {item["_id"]: item["count"] for item in severity_counts},
        "top_targeted_ips": [{"ip": item["_id"], "count": item["count"]} for item in top_targets]
    }
