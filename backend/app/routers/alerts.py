from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal
from models import Alert
from schemas import AlertCreate, AlertResponse

router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic model for status updates
class StatusUpdate(BaseModel):
    status: str

@router.get("/", response_model=list[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """Fetch all security alerts from PostgreSQL."""
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    
    response_alerts = []
    for alert in alerts:
        response_alerts.append(AlertResponse(
            id=str(alert.id),
            flow_id=alert.flow_id,
            severity=alert.severity,
            threat_type=alert.threat_type,
            risk_score=alert.risk_score,
            status=alert.status,
            created_at=alert.created_at.isoformat()
        ))
    return response_alerts

@router.post("/create", response_model=AlertResponse)
def create_alert(alert_data: AlertCreate, db: Session = Depends(get_db)):
    """Create a new security alert when a threat is detected."""
    alert_dict = alert_data.model_dump()
    
    if not alert_dict.get("severity"):
        if alert_data.risk_score >= 0.90:
            alert_dict["severity"] = "Critical"
        elif alert_data.risk_score >= 0.75:
            alert_dict["severity"] = "High"
        else:
            alert_dict["severity"] = "Medium"

    alert_dict["status"] = "New"
    new_alert = Alert(**alert_dict)
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    return AlertResponse(
        id=str(new_alert.id),
        flow_id=new_alert.flow_id,
        severity=new_alert.severity,
        threat_type=new_alert.threat_type,
        risk_score=new_alert.risk_score,
        status=new_alert.status,
        created_at=new_alert.created_at.isoformat()
    )

# NEW: Endpoint to update alert status (Incident Management)
@router.put("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(alert_id: str, status_update: StatusUpdate, db: Session = Depends(get_db)):
    """Update the status of an alert (e.g., Investigating, Resolved, False Positive)"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = status_update.status
    db.commit()
    db.refresh(alert)
    
    return AlertResponse(
        id=str(alert.id),
        flow_id=alert.flow_id,
        severity=alert.severity,
        threat_type=alert.threat_type,
        risk_score=alert.risk_score,
        status=alert.status,
        created_at=alert.created_at.isoformat()
    )

@router.delete("/")
def delete_all_alerts(db: Session = Depends(get_db)):
    """Delete all alerts from the database (Useful for demos/resetting)"""
    db.query(Alert).delete()
    db.commit()
    return {"message": "All alerts have been successfully cleared"}