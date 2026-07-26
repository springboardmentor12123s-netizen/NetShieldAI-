from typing import List
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from app.database import mongo_db
from app.schemas.traffic import TrafficOut
from app.auth.dependencies import require_viewer
from app.models.user import User

router = APIRouter(prefix="/traffic", tags=["traffic"])

@router.get("", response_model=List[TrafficOut])
async def list_traffic(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000),
    source_ip: str = None, label: str = None, dataset_source: str = None,
    start_date: datetime = None, end_date: datetime = None,
    current_user: User = Depends(require_viewer)
):
    q = {}
    if source_ip: q["source_ip"] = source_ip
    if label: q["label"] = label
    if dataset_source: q["dataset_source"] = dataset_source
    if start_date or end_date:
        q["timestamp"] = {}
        if start_date: q["timestamp"]["$gte"] = start_date
        if end_date: q["timestamp"]["$lte"] = end_date
    docs = await mongo_db.traffic.find(q).skip(skip).limit(limit).sort("timestamp", -1).to_list(length=limit)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs

@router.get("/stats")
async def traffic_stats(current_user: User = Depends(require_viewer)):
    pipeline = [{"$group": {"_id": "$label", "count": {"$sum": 1}}}]
    result = await mongo_db.traffic.aggregate(pipeline).to_list(length=100)
    return {"labels": [{"label": r["_id"], "count": r["count"]} for r in result]}
