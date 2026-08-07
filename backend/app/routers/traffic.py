from fastapi import APIRouter
import pandas as pd
from fastapi import Body

router = APIRouter(
    prefix="/traffic",
    tags=["Traffic Monitoring"]
)

DATASET_PATH = "datasets/WebAttacks-Thursday-no-metadata.parquet"


# Summary API
@router.get("/summary")
def traffic_summary():

    df = pd.read_parquet(DATASET_PATH)

    return {
        "total_records": len(df),
        "total_columns": len(df.columns)
    }


# Packet Collection API
@router.get("/packets")
def get_packets():

    df = pd.read_parquet(DATASET_PATH)

    packets = []

    for _, row in df.head(50).iterrows():

        packets.append({
            "protocol": row["Protocol"],
            "flow_duration": row["Flow Duration"],
            "packet_length": row["Packet Length Mean"],
            "flow_bytes_per_sec": row["Flow Bytes/s"],
            "flow_packets_per_sec": row["Flow Packets/s"],
            "label": row["Label"]
        })

    return packets
# Protocol Analysis API
@router.get("/protocols")
def protocol_analysis():

    df = pd.read_parquet(DATASET_PATH)

    protocol_map = {
        6: "TCP",
        17: "UDP",
        1: "ICMP",
        0: "Other"
    }

    protocol_counts = (
        df["Protocol"]
        .map(protocol_map)
        .fillna("Unknown")
        .value_counts()
        .to_dict()
    )

    return protocol_counts
@router.get("/attacks")
def attack_analysis():

    df = pd.read_parquet(DATASET_PATH)

    attack_counts = (
        df["Label"]
        .value_counts()
        .to_dict()
    )

    return attack_counts
@router.get("/statistics")
def traffic_statistics():

    df = pd.read_parquet(DATASET_PATH)

    return {
        "Total Records": len(df),
        "Average Flow Duration": float(df["Flow Duration"].mean()),
        "Average Packet Length": float(df["Packet Length Mean"].mean()),
        "Average Flow Bytes/s": float(df["Flow Bytes/s"].mean()),
        "Average Flow Packets/s": float(df["Flow Packets/s"].mean())
    }
@router.get("/dashboard")
def dashboard():

    df = pd.read_parquet(DATASET_PATH)

    protocol_map = {
        6: "TCP",
        17: "UDP",
        1: "ICMP",
        0: "Other"
    }

    protocol_counts = (
        df["Protocol"]
        .map(protocol_map)
        .fillna("Unknown")
        .value_counts()
        .to_dict()
    )

    attack_counts = (
        df["Label"]
        .value_counts()
        .to_dict()
    )

    return {
        "total_records": len(df),
        "total_columns": len(df.columns),
        "protocols": protocol_counts,
        "attacks": attack_counts,
        "statistics": {
            "average_flow_duration": float(df["Flow Duration"].mean()),
            "average_packet_length": float(df["Packet Length Mean"].mean()),
            "average_flow_bytes_per_sec": float(df["Flow Bytes/s"].mean()),
            "average_flow_packets_per_sec": float(df["Flow Packets/s"].mean())
        }
    }
UNSW_DATASET = "datasets/UNSW_NB15_testing-set.csv"


@router.get("/unsw-summary")
def unsw_summary():

    df = pd.read_csv(UNSW_DATASET)

    return {
        "dataset": "UNSW-NB15",
        "total_records": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns[:10])
    }
@router.get("/unsw-protocols")
def unsw_protocols():

    df = pd.read_csv(UNSW_DATASET)

    protocol_counts = (
        df["proto"]
        .value_counts()
        .to_dict()
    )

    return protocol_counts
@router.get("/unsw-attacks")
def unsw_attacks():

    df = pd.read_csv(UNSW_DATASET)

    attack_counts = (
        df["attack_cat"]
        .fillna("Normal")
        .value_counts()
        .to_dict()
    )

    return attack_counts
@router.get("/unsw-dashboard")
def unsw_dashboard():

    df = pd.read_csv(UNSW_DATASET)

    return {
        "dataset": "UNSW-NB15",
        "total_records": len(df),
        "total_columns": len(df.columns),
        "protocols": df["proto"].value_counts().to_dict(),
        "attacks": df["attack_cat"].fillna("Normal").value_counts().to_dict()
    }

from collections import deque

live_predictions = deque(maxlen=100)
live_alerts = deque(maxlen=20)
attack_history = deque(maxlen=30)

@router.post("/live/update")
def update_live_prediction(data: dict = Body(...)):

    live_predictions.appendleft(data)
    attack_history.append({
    "time": data.get("timestamp"),
    "attacks": 1 if data.get("prediction") != "Benign" else 0
})

    if data.get("risk") in [ "High", "Critical"]:
        live_alerts.appendleft({
            "timestamp": data.get("timestamp"),
            "source": data.get("source"),
            "destination": data.get("destination"),
            "protocol": data.get("protocol"),
            "prediction": data.get("prediction"),
            "risk": data.get("risk"),
            "threat": data.get("threat_type"),
            "recommendation": data.get("recommendation"),
            "status": "Open"
        })

    return {"message": "Updated"}

@router.get("/live")
def get_live_prediction():
    if live_predictions:
        return live_predictions[0]

    return {
        "prediction": "Waiting...",
        "confidence": 0,
        "risk": "Unknown",
        "threat_type": "",
        "recommendation": "",
        "source": "",
        "destination": ""
    }
@router.get("/live/history")
def get_live_history():
    return list(live_predictions)
@router.get("/live/dashboard")
def live_dashboard():

    total_packets = len(live_predictions)

    protocols = {}
    predictions = {}
    risks = {}

    for packet in live_predictions:

        protocol = packet.get("protocol", "Unknown")
        prediction = packet.get("prediction", "Unknown")
        risk = packet.get("risk", "Unknown")

        protocols[protocol] = protocols.get(protocol, 0) + 1
        predictions[prediction] = predictions.get(prediction, 0) + 1
        risks[risk] = risks.get(risk, 0) + 1

    return {
        "total_packets": total_packets,
        "protocols": protocols,
        "predictions": predictions,
        "risks": risks
    }
@router.get("/alerts")
def get_alerts():
    return list(live_alerts)


@router.get("/alerts/latest")
def latest_alert():

    if live_alerts:
        return live_alerts[0]

    return {
        "message": "No active alerts"
    }
@router.get("/attack-trends")
def attack_trends():
    return list(attack_history)
@router.get("/threat-report")
def threat_report():

    total_packets = len(live_predictions)

    attacks = sum(
        1 for packet in live_predictions
        if packet.get("prediction") != "Benign"
    )

    normal = total_packets - attacks

    detection_rate = (
        round((normal / total_packets) * 100, 2)
        if total_packets > 0 else 0
    )

    protocols = {}
    risks = {}
    threats = {}

    for packet in live_predictions:

        protocol = packet.get("protocol", "Unknown")
        risk = packet.get("risk", "Unknown")
        threat = packet.get("threat_type", "Unknown")

        protocols[protocol] = protocols.get(protocol, 0) + 1
        risks[risk] = risks.get(risk, 0) + 1
        threats[threat] = threats.get(threat, 0) + 1

    top_threat = (
        max(threats, key=threats.get)
        if threats else "None"
    )

    return {
        "generated_at": live_predictions[0]["timestamp"] if total_packets else "",
        "total_packets": total_packets,
        "normal_traffic": normal,
        "attacks_detected": attacks,
        "detection_rate": detection_rate,
        "protocols": protocols,
        "risks": risks,
        "top_threat": top_threat,
        "recommendation":
            "Continue monitoring network traffic and investigate High/Critical alerts."
    }