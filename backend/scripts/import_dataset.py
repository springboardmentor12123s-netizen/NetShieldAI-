import pandas as pd
from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:Postgresql@localhost:5432/netshield_ai"

engine = create_engine(DATABASE_URL)

print("Reading CSV...")

df = pd.read_csv(
    "../datasets/CICIDS2017/Tuesday-WorkingHours.pcap_ISCX.csv"
)

print("Original rows:", len(df))

# Remove extra spaces
df.columns = df.columns.str.strip()

# Keep only required columns
df = df[
    [
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
]

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

print(df.head())

print("Importing into PostgreSQL...")

df.to_sql(
    "network_traffic",
    engine,
    if_exists="append",
    index=False,
)

print("Dataset imported successfully!")
print("Rows inserted:", len(df))