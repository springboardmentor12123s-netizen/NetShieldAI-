from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data.incidents import incidents

router = APIRouter(prefix="/incidents", tags=["Incidents"])


class AssignRequest(BaseModel):
    analyst: str


class StatusRequest(BaseModel):
    status: str


# ---------------------------------------------------
# Get All Incidents
# ---------------------------------------------------

@router.get("/")
def get_incidents():
    return {
        "count": len(incidents),
        "incidents": incidents
    }


# ---------------------------------------------------
# Assign Incident
# ---------------------------------------------------

@router.put("/{incident_id}/assign")
def assign_incident(incident_id: str, body: AssignRequest):

    for incident in incidents:

        if incident["id"] == incident_id:

            if incident["status"] == "Closed":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot assign a closed incident."
                )

            incident["assigned_to"] = body.analyst

            return incident

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )


# ---------------------------------------------------
# Update Status Manually
# ---------------------------------------------------

@router.put("/{incident_id}/status")
def update_status(incident_id: str, body: StatusRequest):

    for incident in incidents:

        if incident["id"] == incident_id:

            incident["status"] = body.status

            if body.status == "Closed":
                incident["closed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            return incident

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )


# ---------------------------------------------------
# Acknowledge Incident
# ---------------------------------------------------

@router.put("/{incident_id}/acknowledge")
def acknowledge_incident(incident_id: str):

    for incident in incidents:

        if incident["id"] == incident_id:

            incident["status"] = "Acknowledged"

            return incident

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )


# ---------------------------------------------------
# Close Incident
# ---------------------------------------------------

@router.put("/{incident_id}/close")
def close_incident(incident_id: str):

    for incident in incidents:

        if incident["id"] == incident_id:

            incident["status"] = "Closed"

            incident["closed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            return incident

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )


# ---------------------------------------------------
# Delete Incident
# ---------------------------------------------------

@router.delete("/{incident_id}")
def delete_incident(incident_id: str):

    for i, incident in enumerate(incidents):

        if incident["id"] == incident_id:

            incidents.pop(i)

            return {
                "message": "Incident deleted successfully"
            }

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )