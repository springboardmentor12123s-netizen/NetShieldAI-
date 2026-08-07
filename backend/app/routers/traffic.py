from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from mongo_db import flows_collection
from collections import Counter
from models import Alert
from sqlalchemy import func


router = APIRouter()

# Dependency to get the SQL database session (for future use)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/flows")
def get_recent_flows(limit: int = 50):
    """Fetch the most recent network flows from MongoDB for the live table."""
    # Sort by timestamp descending, limit to 'limit'
    flows = flows_collection.find().sort("timestamp", -1).limit(limit)
    
    # Convert MongoDB cursor to list and format data for frontend
    result = []
    for flow in flows:
        # Convert ObjectId and Timestamp to string for JSON serialization
        flow["_id"] = str(flow["_id"])
        flow["timestamp"] = flow["timestamp"].isoformat()
        result.append(flow)
        
    return {"flows": result}

@router.get("/stats")
def get_traffic_stats():
    """Fetch aggregated data for the dashboard charts."""
    total_flows = flows_collection.count_documents({})
    
    # Get Protocol Distribution (for Doughnut Chart)
    pipeline_protocol = [
        {"$group": {"_id": "$protocol", "count": {"$sum": 1}}}
    ]
    protocol_data = list(flows_collection.aggregate(pipeline_protocol))
    protocols = {item["_id"]: item["count"] for item in protocol_data}
    
    # Get Attack vs Benign Distribution (for Bar Chart)
    pipeline_label = [
        {"$group": {"_id": "$label", "count": {"$sum": 1}}}
    ]
    label_data = list(flows_collection.aggregate(pipeline_label))
    labels = {item["_id"]: item["count"] for item in label_data}
    
    return {
        "total_flows": total_flows,
        "protocol_distribution": protocols,
        "label_distribution": labels
    }

@router.get("/alert-analytics")
def get_alert_analytics(db: Session = Depends(get_db)):
    """Fetch analytics data from the alerts table for the dashboard charts."""
    
    # Count alerts by severity
    severity_data = db.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()
    severity_dict = {item[0]: item[1] for item in severity_data}
    
    # Count alerts by threat type
    threat_data = db.query(Alert.threat_type, func.count(Alert.id)).group_by(Alert.threat_type).all()
    threat_dict = {item[0]: item[1] for item in threat_data}

    return {
        "severity_distribution": severity_dict,
        "threat_distribution": threat_dict,
        "total_alerts": db.query(Alert).count()
    }