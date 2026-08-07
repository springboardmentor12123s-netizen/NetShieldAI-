from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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

@router.get("/", response_model=list[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """Fetch all security alerts from PostgreSQL."""
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    
    # Convert SQLAlchemy objects to Pydantic response models safely
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
    
    # Convert Pydantic model to dictionary so we can modify it safely
    alert_dict = alert_data.model_dump()
    
    # Determine severity based on risk score if severity is empty
    if not alert_dict.get("severity"):
        if alert_data.risk_score >= 0.90:
            alert_dict["severity"] = "Critical"
        elif alert_data.risk_score >= 0.75:
            alert_dict["severity"] = "High"
        else:
            alert_dict["severity"] = "Medium"

    # Add default status
    alert_dict["status"] = "New"

    # Create the new Alert object using the dictionary
    new_alert = Alert(**alert_dict)
    
    # Save to PostgreSQL
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # Convert UUID and Timestamp to string for the response
    return AlertResponse(
        id=str(new_alert.id),
        flow_id=new_alert.flow_id,
        severity=new_alert.severity,
        threat_type=new_alert.threat_type,
        risk_score=new_alert.risk_score,
        status=new_alert.status,
        created_at=new_alert.created_at.isoformat()
    )