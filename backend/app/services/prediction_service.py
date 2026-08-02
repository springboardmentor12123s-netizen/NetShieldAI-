import pandas as pd
from sqlalchemy.orm import Session

from app.ai.predict import predict_attack
from app.services.flow_builder import get_flows
from app.services.alert_service import create_alert


def get_severity(prediction: str):

    prediction = prediction.upper()

    if prediction == "BENIGN":
        return "LOW"

    elif "PORTSCAN" in prediction:
        return "MEDIUM"

    elif "DOS" in prediction:
        return "HIGH"

    elif "DDOS" in prediction:
        return "CRITICAL"

    elif "BOT" in prediction:
        return "HIGH"

    elif "WEB" in prediction:
        return "HIGH"

    else:
        return "MEDIUM"


def predict_live_traffic(db: Session):

    flows = get_flows()

    predictions = []

    for flow in flows:

        features = {

            "Destination Port": flow["Destination Port"],

            "Flow Duration": flow["Flow Duration"],

            "Total Fwd Packets": flow["Total Fwd Packets"],

            "Total Backward Packets": flow["Total Backward Packets"],

            "Total Length of Fwd Packets":
                flow["Total Length of Fwd Packets"],

            "Total Length of Bwd Packets":
                flow["Total Length of Bwd Packets"],

            "Flow Bytes/s":
                flow["Flow Bytes/s"],

            "Flow Packets/s":
                flow["Flow Packets/s"]

        }

        attack = predict_attack(features)

        severity = get_severity(attack)

        if attack.upper() != "BENIGN":

            create_alert(
                db=db,
                source_ip=flow["source_ip"],
                destination_ip=flow["destination_ip"],
                protocol=flow["protocol"],
                attack_type=attack,
                severity=severity,
            )

        predictions.append({

            "source_ip": flow["source_ip"],

            "destination_ip": flow["destination_ip"],

            "protocol": flow["protocol"],
            
            "destination_port": flow["Destination Port"],
            
            "prediction": attack,

            "severity": severity,

            "status":
                "Threat Detected"
                if attack.upper() != "BENIGN"
                else "Normal Traffic"

        })

    return predictions