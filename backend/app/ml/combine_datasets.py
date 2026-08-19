import pandas as pd
from pathlib import Path

BASE = Path("app/data/processed")

CICIDS_FILE = BASE / "cicids2017_processed.csv"
UNSW_FILE = BASE / "unsw_nb15_processed.csv"
OUTPUT_FILE = BASE / "netshield_combined.csv"


def prepare_cicids():
    print("Loading CICIDS2017...")

    df = pd.read_csv(CICIDS_FILE)

    # Convert CICIDS2017 features to NetShield common feature names
    result = pd.DataFrame()

    result["duration"] = df["Flow Duration"]

    result["protocol_type"] = "unknown"

    result["src_bytes"] = df["Total Length of Fwd Packets"]

    result["dst_bytes"] = df["Total Length of Bwd Packets"]

    result["packet_count"] = (
        df["Total Fwd Packets"] +
        df["Total Backward Packets"]
    )

    result["flow_rate"] = df["Flow Packets/s"]

    result["wrong_fragment"] = 0

    result["urgent"] = 0

    result["count"] = df["Total Fwd Packets"]

    result["srv_count"] = df["Total Backward Packets"]

    result["label"] = (
        df["traffic_label"]
        .astype(str)
        .str.lower()
        .map({
            "normal": "normal",
            "attack": "attack"
        })
    )

    return result


def prepare_unsw():
    print("Loading UNSW-NB15...")

    df = pd.read_csv(UNSW_FILE)

    columns = [
        "duration",
        "protocol_type",
        "src_bytes",
        "dst_bytes",
        "packet_count",
        "flow_rate",
        "wrong_fragment",
        "urgent",
        "count",
        "srv_count",
        "label",
    ]

    result = df[columns].copy()

    result["label"] = (
        result["label"]
        .astype(str)
        .str.lower()
        .map({
            "normal": "normal",
            "attack": "attack"
        })
    )

    return result


def main():
    print("=" * 60)
    print("NetShield AI - Combining Real Datasets")
    print("=" * 60)

    cicids = prepare_cicids()
    unsw = prepare_unsw()

    print()
    print("CICIDS2017 rows:", len(cicids))
    print("UNSW-NB15 rows:", len(unsw))

    combined = pd.concat(
        [cicids, unsw],
        ignore_index=True
    )

    # Remove invalid values
    combined = combined.replace(
        [float("inf"), float("-inf")],
        pd.NA
    )

    combined = combined.dropna()

    # Remove duplicate records
    before = len(combined)
    combined = combined.drop_duplicates()
    duplicates = before - len(combined)

    print("Removed duplicates:", duplicates)

    combined.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("=" * 60)
    print("COMBINATION COMPLETE")
    print("=" * 60)

    print("Output:", OUTPUT_FILE)
    print("Rows:", len(combined))
    print("Columns:", len(combined.columns))

    print()
    print("Columns:")
    print(combined.columns.tolist())

    print()
    print("Label distribution:")
    print(combined["label"].value_counts())

    print()
    print("Saved successfully.")


if __name__ == "__main__":
    main()