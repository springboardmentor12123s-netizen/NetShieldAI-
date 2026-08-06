"""NetShield AI - Alerts API."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from app.core.dependencies import get_current_user, require_roles
from app.core.mongodb import MongoDBManager
from app.schemas.alert import AlertCreate, AlertResponse, AlertFilter

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_in: AlertCreate,
    current_user: dict = Depends(require_roles(["admin", "system"]))
):
    """System endpoint to create an alert manually or from workers."""
    db = MongoDBManager.get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    alert_doc = alert_in.model_dump()
    alert_doc["_id"] = str(uuid.uuid4())
    alert_doc["timestamp"] = datetime.now(timezone.utc)
    
    await db["alerts"].insert_one(alert_doc)
    
    # Format for response
    alert_doc["id"] = alert_doc.pop("_id")
    return alert_doc


@router.get("", response_model=Dict[str, Any])
async def get_alerts(
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    incident_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List and filter network security alerts."""
    db = MongoDBManager.get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Build query filter
    query_filter = {}
    if severity:
        query_filter["severity"] = severity
    if alert_type:
        query_filter["alert_type"] = alert_type
    if incident_id:
        query_filter["incident_id"] = incident_id
        
    skip = (page - 1) * per_page
    
    cursor = db["alerts"].find(query_filter).sort("timestamp", -1).skip(skip).limit(per_page)
    alerts = await cursor.to_list(length=per_page)
    
    total = await db["alerts"].count_documents(query_filter)
    
    formatted_alerts = []
    for doc in alerts:
        doc["id"] = doc.pop("_id")
        formatted_alerts.append(doc)
        
    return {
        "items": formatted_alerts,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page
    }
