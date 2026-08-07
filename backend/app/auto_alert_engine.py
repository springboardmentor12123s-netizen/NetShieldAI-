import time
from mongo_db import flows_collection
from ai_engine import predict_threat
from database import SessionLocal
from models import Alert
from datetime import datetime

def run_auto_alert_engine():
    print("🚨 Starting Auto-Alert Engine...")
    print("Monitoring network traffic for high-risk threats (Risk > 75%)...")
    
    # Clear old alerts for a fresh demo
    db = SessionLocal()
    db.query(Alert).delete()
    db.commit()
    db.close()

    while True:
        try:
            # 1. Get the latest flow from MongoDB
            latest_flow = flows_collection.find_one(sort=[("timestamp", -1)])
            
            if latest_flow:
                # 2. Extract features for the AI
                flow_features = {
                    ' Flow Duration': latest_flow.get("flow_duration", 0),
                    ' Total Fwd Packets': latest_flow.get("total_fwd_packets", 0),
                    ' Total Backward Packets': latest_flow.get("total_backward_packets", 0),
                    ' Fwd Packet Length Max': latest_flow.get("total_bytes", 0),
                    ' Fwd Packet Length Mean': (latest_flow.get("total_bytes", 0) / 2),
                    'Flow Bytes/s': latest_flow.get("total_bytes", 0),
                    ' Flow Packets/s': latest_flow.get("total_fwd_packets", 0)
                }
                
                # 3. Run the AI prediction
                ai_result = predict_threat(flow_features)
                
                               # 4. If Risk Score is greater than 75, create an Alert!
                if ai_result["risk_score"] > 75: # Changed from 0.75 to 75
                    db = SessionLocal()
                    
                    new_alert = Alert(
                        flow_id=str(latest_flow["_id"]),
                        severity="Critical" if ai_result["risk_score"] > 90 else "High",
                        threat_type=ai_result["threat_classification"],
                        risk_score=ai_result["risk_score"],
                        status="New"
                    )
                    
                    db.add(new_alert)
                    db.commit()
                    db.close()
                    
                    print(f"🚨 ALERT GENERATED! Threat: {ai_result['threat_classification']} | Risk: {ai_result['risk_score']}%")
                else:
                    print(f"✅ Flow analyzed. Risk: {ai_result['risk_score']}%. No alert generated.")
                    
        except Exception as e:
            print(f"Error in engine: {e}")
            
        # Wait 15 seconds before checking the next flow
        time.sleep(15)

if __name__ == "__main__":
    run_auto_alert_engine()