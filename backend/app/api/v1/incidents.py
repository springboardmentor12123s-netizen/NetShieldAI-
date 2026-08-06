"""NetShield AI - Incidents API."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.core.dependencies import get_current_user, get_db, require_roles
from app.models.incident import Incident
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse, IncidentAssign

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    incident_in: IncidentCreate,
    current_user: dict = Depends(require_roles(["admin", "security_analyst", "analyst"])),
    db: AsyncSession = Depends(get_db)
):
    """Create a new incident ticket."""
    incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return incident


@router.get("", response_model=List[IncidentResponse])
async def list_incidents(
    skip: int = 0, limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all incidents."""
    query = select(Incident).options(selectinload(Incident.assigned_to)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get incident by ID."""
    query = select(Incident).options(selectinload(Incident.assigned_to)).where(Incident.id == incident_id)
    result = await db.execute(query)
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: UUID,
    incident_in: IncidentUpdate,
    current_user: dict = Depends(require_roles(["admin", "security_analyst", "analyst"])),
    db: AsyncSession = Depends(get_db)
):
    """Update incident status and details."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = incident_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(incident, field, value)
    
    await db.commit()
    await db.refresh(incident)
    
    # Reload relation if assigned_to changed
    if "assigned_to_id" in update_data:
        query = select(Incident).options(selectinload(Incident.assigned_to)).where(Incident.id == incident_id)
        result = await db.execute(query)
        incident = result.scalar_one_or_none()
        
    return incident
