from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ai_engine import predict_threat
from database import SessionLocal
from models import Alert
from notifications import send_alert_email # NEW IMPORT
import random

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class FlowFeatures(BaseModel):
    flow_duration: float
    total_fwd_packets: int
    total_backward_packets: int
    fwd_packet_length_max: float
    fwd_packet_length_mean: float
    flow_bytes_per_sec: float
    flow_packets_per_sec: float

@router.post("/predict")
def predict_flow(features: FlowFeatures, db: Session = Depends(get_db)):
    ai_features = {
        'Flow duration': features.flow_duration,
        'Total fwd packets': features.total_fwd_packets,
        'Total backward packets': features.total_backward_packets,
        'Fwd packet length max': features.fwd_packet_length_max,
        'Fwd packet length mean': features.fwd_packet_length_mean,
        'Flow bytes/s': features.flow_bytes_per_sec,
        'Flow packets/s': features.flow_packets_per_sec
    }
    
    prediction = predict_threat(ai_features)
    
    if prediction["risk_score"] > 50:
        if prediction["risk_score"] >= 90: severity = "Critical"
        elif prediction["risk_score"] >= 75: severity = "High"
        else: severity = "Medium"
            
        src_ip = f"10.0.{random.randint(1, 255)}.{random.randint(1, 255)}"
        dst_ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
        
        new_alert = Alert(
            flow_id=f"{src_ip}-{dst_ip}-TCP",
            severity=severity,
            threat_type=prediction["threat_classification"],
            risk_score=prediction["risk_score"],
            status="Simulated"
        )
        db.add(new_alert)
        db.commit()
        
        # NEW: Send email notification for Critical/High risks
        if prediction["risk_score"] >= 75:
            send_alert_email(prediction["threat_classification"], prediction["risk_score"], src_ip, dst_ip)
            
    return prediction