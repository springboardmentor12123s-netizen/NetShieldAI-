import pandas as pd
from sqlalchemy import create_engine
from pathlib import Path

DATABASE_URL = "postgresql://postgres:Postgresql@localhost:5432/netshield_ai"

engine = create_engine(DATABASE_URL)

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "datasets" / "CICIDS2017"

print("BASE_DIR:", BASE_DIR)
print("DATASET_DIR:", DATASET_DIR)
print("Exists:", DATASET_DIR.exists())

csv_files = list(DATASET_DIR.glob("*.csv"))

SKIP_FILES = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
]

print(f"\nFound {len(csv_files)} CSV files.\n")

for file in csv_files:

    if file.name in SKIP_FILES:
        print(f"Skipping already imported file: {file.name}")
        continue

    print("=" * 60)
    print("Importing:", file.name)

    try:
        df = pd.read_csv(file)

        print("Rows:", len(df))

        # Remove extra spaces from column names
        df.columns = df.columns.str.strip()

        # Required columns (without Protocol)
        required_columns = [
            "Destination Port",
            "Flow Duration",
            "Total Fwd Packets",
            "Total Backward Packets",
            "Total Length of Fwd Packets",
            "Total Length of Bwd Packets",
            "Flow Bytes/s",
            "Flow Packets/s",
            "Label",
        ]

        df = df[required_columns]

        # Rename columns
        df.columns = [
            "destination_port",
            "flow_duration",
            "total_fwd_packets",
            "total_backward_packets",
            "total_length_fwd_packets",
            "total_length_backward_packets",
            "flow_bytes_per_sec",
            "flow_packets_per_sec",
            "label",
        ]

        # Add protocol column
        df["protocol"] = "Unknown"

        # Reorder columns to match PostgreSQL table
        df = df[
            [
                "destination_port",
                "flow_duration",
                "total_fwd_packets",
                "total_backward_packets",
                "total_length_fwd_packets",
                "total_length_backward_packets",
                "flow_bytes_per_sec",
                "flow_packets_per_sec",
                "protocol",
                "label",
            ]
        ]

        df.to_sql(
            "network_traffic",
            engine,
            if_exists="append",
            index=False,
        )

        print("✅ Imported successfully!")

    except Exception as e:
        print(f"❌ Failed to import {file.name}")
        print(e)

print("\n🎉 All possible datasets processed!")