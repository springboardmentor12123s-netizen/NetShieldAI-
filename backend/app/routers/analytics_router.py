from datetime import datetime, timedelta

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.database import alerts_collection, packets_collection, predictions_collection

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/attack-trend")
async def attack_trend(days: int = 7, current_user=Depends(get_current_user)):
    """Attack counts per day for the last N days — Attack Timeline chart."""
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"is_attack": True, "created_at": {"$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    results = []
    async for doc in predictions_collection.aggregate(pipeline):
        results.append({"date": doc["_id"], "count": doc["count"]})
    return results


@router.get("/attack-types")
async def attack_types(current_user=Depends(get_current_user)):
    """Breakdown of attack types — Attack Distribution chart."""
    pipeline = [
        {"$match": {"is_attack": True}},
        {"$group": {"_id": "$attack_type", "count": {"$sum": 1}}},
    ]
    results = []
    async for doc in predictions_collection.aggregate(pipeline):
        results.append({"attack_type": doc["_id"], "count": doc["count"]})
    return results


@router.get("/protocol-distribution")
async def protocol_distribution(current_user=Depends(get_current_user)):
    pipeline = [{"$group": {"_id": "$protocol", "count": {"$sum": 1}}}]
    results = []
    async for doc in packets_collection.aggregate(pipeline):
        results.append({"protocol": doc["_id"], "count": doc["count"]})
    return results


@router.get("/risk-trend")
async def risk_trend(days: int = 7, current_user=Depends(get_current_user)):
    """Average risk score per day — Risk Trend chart."""
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "avg_risk": {"$avg": "$risk_score"},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    results = []
    async for doc in predictions_collection.aggregate(pipeline):
        results.append({"date": doc["_id"], "avg_risk": round(doc["avg_risk"] or 0, 2)})
    return results


@router.get("/detection-stats")
async def detection_stats(current_user=Depends(get_current_user)):
    """Historical Analysis / Detection Statistics summary card."""
    total_predictions = await predictions_collection.count_documents({})
    total_attacks = await predictions_collection.count_documents({"is_attack": True})
    total_alerts = await alerts_collection.count_documents({})
    resolved_alerts = await alerts_collection.count_documents({"resolved": True})
    false_positives = await alerts_collection.count_documents({"false_positive": True})
    detection_rate = round((total_attacks / total_predictions) * 100, 2) if total_predictions else 0
    resolution_rate = round((resolved_alerts / total_alerts) * 100, 2) if total_alerts else 0
    return {
        "total_predictions": total_predictions,
        "total_attacks": total_attacks,
        "total_alerts": total_alerts,
        "resolved_alerts": resolved_alerts,
        "false_positives": false_positives,
        "detection_rate_percent": detection_rate,
        "alert_resolution_rate_percent": resolution_rate,
    }
