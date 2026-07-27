from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_current_user
from app.database import alerts_collection

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    resolved: bool | None = None,
    severity: str | None = None,
    search: str | None = Query(None, description="Matches source IP or attack type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    current_user=Depends(get_current_user),
):
    query: dict = {}
    if resolved is not None:
        query["resolved"] = resolved
    if severity:
        query["severity"] = severity
    if search:
        query["$or"] = [
            {"source_ip": {"$regex": search, "$options": "i"}},
            {"attack_type": {"$regex": search, "$options": "i"}},
        ]

    total = await alerts_collection.count_documents(query)
    cursor = (
        alerts_collection.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc.setdefault("false_positive", False)
        items.append(doc)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current_user=Depends(get_current_user)):
    result = await alerts_collection.update_one(
        {"_id": ObjectId(alert_id)}, {"$set": {"resolved": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "resolved", "id": alert_id}


@router.post("/{alert_id}/false-positive")
async def mark_false_positive(alert_id: str, current_user=Depends(get_current_user)):
    result = await alerts_collection.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"false_positive": True, "resolved": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "marked_false_positive", "id": alert_id}


@router.get("/summary")
async def alerts_summary(current_user=Depends(get_current_user)):
    """Counts by severity, used by dashboard cards."""
    severities = ["critical", "high", "medium", "low"]
    counts = {}
    for sev in severities:
        counts[sev] = await alerts_collection.count_documents({"severity": sev})
    total = await alerts_collection.count_documents({})
    false_positives = await alerts_collection.count_documents({"false_positive": True})
    return {"total": total, "false_positives": false_positives, **counts}
