from fastapi import APIRouter, Body
import pandas as pd
from collections import deque
from datetime import datetime, timedelta

from app.database.database import SessionLocal
from app.database.models import Alert
from app.ai.live_state import live_performance


router = APIRouter(
    prefix="/traffic",
    tags=["Traffic Monitoring"]
)


# ============================================================
# DATASET PATHS
# ============================================================

DATASET_PATH = "datasets/WebAttacks-Thursday-no-metadata.parquet"

UNSW_DATASET = "datasets/UNSW_NB15_testing-set.csv"


# ============================================================
# LIVE MEMORY
# ============================================================

live_predictions = deque(maxlen=100)

live_alerts = deque(maxlen=20)

attack_history = deque(maxlen=30)


# ============================================================
# ALERT SERIALIZER
# ============================================================

def serialize_alert(alert):

    return {
        "id": alert.id,
        "timestamp": (
            alert.timestamp.isoformat()
            if alert.timestamp
            else ""
        ),
        "source": alert.source,
        "destination": alert.destination,
        "protocol": alert.protocol,
        "prediction": alert.prediction,
        "risk": alert.risk,
        "threat": alert.threat,
        "recommendation": alert.recommendation,
        "status": alert.status
    }


# ============================================================
# SUMMARY API
# ============================================================

@router.get("/summary")
def traffic_summary():

    df = pd.read_parquet(DATASET_PATH)

    return {
        "total_records": len(df),
        "total_columns": len(df.columns)
    }


# ============================================================
# PACKET COLLECTION API
# ============================================================

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


# ============================================================
# PROTOCOL ANALYSIS
# ============================================================

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


# ============================================================
# ATTACK ANALYSIS
# ============================================================

@router.get("/attacks")
def attack_analysis():

    df = pd.read_parquet(DATASET_PATH)

    attack_counts = (
        df["Label"]
        .value_counts()
        .to_dict()
    )

    return attack_counts


# ============================================================
# TRAFFIC STATISTICS
# ============================================================

@router.get("/statistics")
def traffic_statistics():

    df = pd.read_parquet(DATASET_PATH)

    return {
        "Total Records": len(df),

        "Average Flow Duration":
            float(df["Flow Duration"].mean()),

        "Average Packet Length":
            float(df["Packet Length Mean"].mean()),

        "Average Flow Bytes/s":
            float(df["Flow Bytes/s"].mean()),

        "Average Flow Packets/s":
            float(df["Flow Packets/s"].mean())
    }


# ============================================================
# DASHBOARD
# ============================================================

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
            "average_flow_duration":
                float(df["Flow Duration"].mean()),

            "average_packet_length":
                float(df["Packet Length Mean"].mean()),

            "average_flow_bytes_per_sec":
                float(df["Flow Bytes/s"].mean()),

            "average_flow_packets_per_sec":
                float(df["Flow Packets/s"].mean())
        }
    }


# ============================================================
# UNSW-NB15
# ============================================================

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

    return (
        df["proto"]
        .value_counts()
        .to_dict()
    )


@router.get("/unsw-attacks")
def unsw_attacks():

    df = pd.read_csv(UNSW_DATASET)

    return (
        df["attack_cat"]
        .fillna("Normal")
        .value_counts()
        .to_dict()
    )


@router.get("/unsw-dashboard")
def unsw_dashboard():

    df = pd.read_csv(UNSW_DATASET)

    return {
        "dataset": "UNSW-NB15",

        "total_records": len(df),

        "total_columns": len(df.columns),

        "protocols":
            df["proto"]
            .value_counts()
            .to_dict(),

        "attacks":
            df["attack_cat"]
            .fillna("Normal")
            .value_counts()
            .to_dict()
    }


# ============================================================
# LIVE UPDATE
# ============================================================

@router.post("/live/update")
def update_live_prediction(
    data: dict = Body(...)
):

    # --------------------------------------------------------
    # Store latest prediction
    # --------------------------------------------------------

    live_predictions.appendleft(data)


    # --------------------------------------------------------
    # Attack trend
    # --------------------------------------------------------

    attack_history.append({
        "time": data.get("timestamp"),

        "attacks":
            1
            if data.get("prediction") != "Benign"
            else 0
    })


    # --------------------------------------------------------
    # HIGH / CRITICAL ALERT
    # --------------------------------------------------------

    if data.get("risk") in ["High", "Critical"]:

        # Create live alert
        alert_data = {
            "timestamp": data.get("timestamp"),
            "source": data.get("source"),
            "destination": data.get("destination"),
            "protocol": data.get("protocol"),
            "prediction": data.get("prediction"),
            "risk": data.get("risk"),
            "threat": data.get("threat_type"),
            "recommendation": data.get("recommendation"),
            "status": "Open"
        }

        # Keep recent alerts in memory
        live_alerts.appendleft(alert_data)


        # ----------------------------------------------------
        # Save alert to PostgreSQL
        # ----------------------------------------------------

        db = SessionLocal()

        try:

            new_alert = Alert(
                source=data.get("source"),
                destination=data.get("destination"),
                protocol=data.get("protocol"),
                prediction=data.get("prediction"),
                risk=data.get("risk"),
                threat=data.get("threat_type"),
                recommendation=data.get("recommendation"),
                status="Open"
            )

            db.add(new_alert)

            db.commit()

            db.refresh(new_alert)

            print(
                "Alert saved to database:",
                new_alert.id
            )

        except Exception as e:

            db.rollback()

            print(
                "Alert database error:",
                e
            )

        finally:

            db.close()


    return {
        "message": "Updated"
    }


# ============================================================
# LIVE PERFORMANCE
# ============================================================

@router.post("/live/performance")
def update_live_performance(
    data: dict
):

    live_performance.update(data)

    return {
        "status": "success",
        "data": live_performance
    }


@router.get("/live/performance")
def get_live_performance():

    return live_performance


# ============================================================
# LATEST LIVE PREDICTION
# ============================================================

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


# ============================================================
# LIVE HISTORY
# ============================================================

@router.get("/live/history")
def get_live_history():

    return list(live_predictions)


# ============================================================
# LIVE DASHBOARD
# ============================================================

@router.get("/live/dashboard")
def live_dashboard():

    total_packets = len(live_predictions)

    protocols = {}

    predictions = {}

    risks = {}


    for packet in live_predictions:

        protocol = packet.get(
            "protocol",
            "Unknown"
        )

        prediction = packet.get(
            "prediction",
            "Unknown"
        )

        risk = packet.get(
            "risk",
            "Unknown"
        )


        protocols[protocol] = (
            protocols.get(protocol, 0) + 1
        )

        predictions[prediction] = (
            predictions.get(prediction, 0) + 1
        )

        risks[risk] = (
            risks.get(risk, 0) + 1
        )


    return {
        "total_packets": total_packets,

        "protocols": protocols,

        "predictions": predictions,

        "risks": risks
    }


# ============================================================
# ALL ALERTS
# ============================================================

@router.get("/alerts")
def get_alerts():

    db = SessionLocal()

    try:

        alerts = (
            db.query(Alert)
            .order_by(Alert.timestamp.desc())
            .all()
        )

        return {
            "value": [
                serialize_alert(alert)
                for alert in alerts
            ],

            "Count": len(alerts)
        }

    finally:

        db.close()


# ============================================================
# LATEST ALERT
# ============================================================

@router.get("/alerts/latest")
def latest_alert():

    db = SessionLocal()

    try:

        alert = (
            db.query(Alert)
            .order_by(Alert.timestamp.desc())
            .first()
        )

        if not alert:

            return {
                "message": "No active alerts"
            }

        return serialize_alert(alert)

    finally:

        db.close()


# ============================================================
# RESOLVE ALERT
# ============================================================

@router.put("/alerts/resolve")
def resolve_alert(
    data: dict = Body(...)
):

    alert_id = data.get("id")

    timestamp = data.get("timestamp")


    db = SessionLocal()

    try:

        alert = None


        # ----------------------------------------------------
        # Prefer alert ID
        # ----------------------------------------------------

        if alert_id is not None:

            alert = (
                db.query(Alert)
                .filter(Alert.id == alert_id)
                .first()
            )


        # ----------------------------------------------------
        # Fallback to timestamp
        # ----------------------------------------------------

        if alert is None and timestamp:

            alert = (
                db.query(Alert)
                .filter(
                    Alert.timestamp == timestamp
                )
                .first()
            )


        if alert is None:

            return {
                "status": "error",
                "message": "Alert not found"
            }


        alert.status = "Resolved"

        db.commit()

        db.refresh(alert)


        # ----------------------------------------------------
        # Update live memory too
        # ----------------------------------------------------

        for live_alert in live_alerts:

            if (
                timestamp
                and live_alert.get("timestamp") == timestamp
            ):

                live_alert["status"] = "Resolved"


        return {
            "status": "success",

            "message":
                "Alert resolved successfully",

            "alert":
                serialize_alert(alert)
        }

    except Exception as e:

        db.rollback()

        print(
            "Resolve alert error:",
            e
        )

        return {
            "status": "error",
            "message": "Failed to resolve alert"
        }

    finally:

        db.close()


# ============================================================
# ALERT HISTORY - LAST N DAYS
# ============================================================

@router.get("/alerts/history")
def alert_history(
    days: int = 15
):

    # Only allow 15 or 30 days

    if days not in [15, 30]:

        days = 15


    cutoff = (
        datetime.now()
        - timedelta(days=days)
    )


    db = SessionLocal()

    try:

        alerts = (
            db.query(Alert)
            .filter(
                Alert.timestamp >= cutoff
            )
            .order_by(
                Alert.timestamp.desc()
            )
            .all()
        )


        return {
            "days": days,

            "count": len(alerts),

            "alerts": [
                serialize_alert(alert)
                for alert in alerts
            ]
        }

    finally:

        db.close()


# ============================================================
# ATTACK TRENDS
# ============================================================

@router.get("/attack-trends")
def attack_trends():

    return list(attack_history)


# ============================================================
# THREAT REPORT
# ============================================================

@router.get("/threat-report")
def threat_report():

    total_packets = len(live_predictions)


    attacks = sum(
        1
        for packet in live_predictions
        if packet.get("prediction") != "Benign"
    )


    normal = (
        total_packets - attacks
    )


    detection_rate = (

        round(
            (
                normal
                / total_packets
            ) * 100,
            2
        )

        if total_packets > 0

        else 0
    )


    protocols = {}

    risks = {}

    threats = {}


    for packet in live_predictions:

        protocol = packet.get(
            "protocol",
            "Unknown"
        )

        risk = packet.get(
            "risk",
            "Unknown"
        )

        threat = packet.get(
            "threat_type",
            "Unknown"
        )


        protocols[protocol] = (
            protocols.get(protocol, 0) + 1
        )

        risks[risk] = (
            risks.get(risk, 0) + 1
        )

        threats[threat] = (
            threats.get(threat, 0) + 1
        )


    top_threat = (

        max(
            threats,
            key=threats.get
        )

        if threats

        else "None"
    )


    return {

        "generated_at":
            (
                live_predictions[0]["timestamp"]
                if total_packets
                else ""
            ),

        "total_packets":
            total_packets,

        "normal_traffic":
            normal,

        "attacks_detected":
            attacks,

        "detection_rate":
            detection_rate,

        "protocols":
            protocols,

        "risks":
            risks,

        "top_threat":
            top_threat,

        "recommendation":
            "Continue monitoring network traffic and investigate High/Critical alerts."
    }