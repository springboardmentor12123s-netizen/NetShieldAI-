from datetime import datetime, timedelta

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.database import alerts_collection, packets_collection, predictions_collection
from app.ml.dataset_status import get_dataset_status, get_model_status

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(current_user=Depends(get_current_user)):
    """Milestone 1/2 dashboard numbers: totals, health, AI/dataset status."""
    total = await predictions_collection.count_documents({})
    attacks = await predictions_collection.count_documents({"is_attack": True})
    normal = total - attacks
    active_alerts = await alerts_collection.count_documents({"resolved": False})
    critical_alerts = await alerts_collection.count_documents({"resolved": False, "severity": "critical"})

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    packets_today = await packets_collection.count_documents({"timestamp": {"$gte": today_start}})
    total_packets_captured = await packets_collection.count_documents({})
    suspicious_packets = await packets_collection.count_documents({"status": {"$in": ["suspicious", "blocked"]}})

    dataset_status = get_dataset_status()
    model_status = get_model_status()

    # Simple health heuristics — not a real infra monitor, just a signal for the demo UI.
    network_health = "critical" if critical_alerts > 0 else ("warning" if active_alerts > 0 else "healthy")
    system_health = "healthy" if model_status["status"] == "active" else "warning"

    return {
        "welcome_message": f"Welcome {current_user.get('full_name') or current_user['username']}",
        "total_packets": total,
        "packets_today": packets_today,
        "total_packets_captured": total_packets_captured,
        "suspicious_packets": suspicious_packets,
        "normal_traffic": normal,
        "attack_traffic": attacks,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "dataset_status": dataset_status,
        "ai_model_status": model_status,
        "network_health": network_health,
        "system_health": system_health,
    }


@router.get("/recent-predictions")
async def recent_predictions(limit: int = 20, current_user=Depends(get_current_user)):
    cursor = predictions_collection.find().sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/latest-threats")
async def latest_threats(limit: int = 8, current_user=Depends(get_current_user)):
    cursor = alerts_collection.find({"resolved": False}).sort("created_at", -1).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return items


@router.get("/detection-history")
async def detection_history(hours: int = 24, current_user=Depends(get_current_user)):
    """Predictions grouped by hour for the last N hours — Detection History card."""
    since = datetime.utcnow() - timedelta(hours=hours)
    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%dT%H:00:00", "date": "$created_at"}},
                "total": {"$sum": 1},
                "attacks": {"$sum": {"$cond": ["$is_attack", 1, 0]}},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    results = []
    async for doc in predictions_collection.aggregate(pipeline):
        results.append({"hour": doc["_id"], "total": doc["total"], "attacks": doc["attacks"]})
    return results
