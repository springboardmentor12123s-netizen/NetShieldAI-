from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc, asc
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.records import Incident

router = APIRouter(tags=["Incidents"])


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


@router.get("/incidents")
def get_incidents(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "timestamp",
    sort_desc: bool = True
):
    query = select(Incident)

    if status:
        query = query.where(Incident.status == status)
    if severity:
        query = query.where(Incident.severity == severity)
    if priority:
        query = query.where(Incident.priority == priority)
    if search:
        query = query.where(
            Incident.id.ilike(f"%{search}%") |
            Incident.flow_id.ilike(f"%{search}%") |
            Incident.threat_category.ilike(f"%{search}%") |
            Incident.prediction.ilike(f"%{search}%")
        )

    # Total count for pagination
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Sorting
    sort_column = getattr(Incident, sort_by, Incident.timestamp)
    if sort_desc:
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)

    incidents = db.scalars(query).all()

    return {
        "data": incidents,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit if total_count > 0 else 0
    }


@router.get("/incidents/stats")
def get_incident_stats(db: Session = Depends(get_db)):
    # Open Incidents
    open_count = db.scalar(select(func.count()).where(Incident.status == "Open").select_from(Incident))
    # Resolved Incidents
    resolved_count = db.scalar(select(func.count()).where(
        Incident.status.in_(["Resolved", "Closed"])).select_from(Incident))
    # Critical Incidents
    critical_count = db.scalar(select(func.count()).where(Incident.priority == "Critical",
                               Incident.status != "Closed").select_from(Incident))

    # Average Resolution Time (placeholder as requested)
    avg_resolution_time = "N/A"

    return {
        "open_incidents": open_count,
        "resolved_incidents": resolved_count,
        "critical_incidents": critical_count,
        "average_resolution_time": avg_resolution_time
    }


@router.patch("/incidents/{incident_id}")
def update_incident(incident_id: str, update_data: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.scalar(select(Incident).where(Incident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if update_data.status is not None:
        incident.status = update_data.status
    if update_data.assigned_to is not None:
        incident.assigned_to = update_data.assigned_to
    if update_data.notes is not None:
        incident.notes = update_data.notes

    db.commit()
    db.refresh(incident)
    return incident
