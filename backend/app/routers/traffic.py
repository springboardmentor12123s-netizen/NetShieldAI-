from fastapi import APIRouter
import pandas as pd

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