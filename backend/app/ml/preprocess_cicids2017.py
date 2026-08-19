"""
CICIDS2017 preprocessing for NetShield AI.

Reads the original CICIDS2017 CSV files in:
    backend/app/data/CICIDS2017/

Creates:
    backend/app/data/processed/cicids2017_processed.csv

Labels:
    BENIGN    -> Normal
    everything else -> Attack
"""

from pathlib import Path

import numpy as np
import pandas as pd


# Project directories
BASE_DIR = Path(__file__).resolve().parents[1]

INPUT_DIR = BASE_DIR / "data" / "CICIDS2017"
OUTPUT_DIR = BASE_DIR / "data" / "processed"

OUTPUT_FILE = OUTPUT_DIR / "cicids2017_processed.csv"


# Useful CICIDS2017 network-flow features
FEATURES = [
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Fwd Packets/s",
    "Bwd Packets/s",
    "Packet Length Mean",
    "Packet Length Std",
    "SYN Flag Count",
    "RST Flag Count",
    "ACK Flag Count",
    "Average Packet Size",
    "Active Mean",
    "Idle Mean",
]


def preprocess_file(file_path: Path) -> pd.DataFrame:
    """Read and clean one CICIDS2017 CSV file."""

    print(f"\nProcessing: {file_path.name}")

    df = pd.read_csv(
        file_path,
        low_memory=False
    )

    # Remove leading/trailing spaces from column names.
    df.columns = df.columns.str.strip()

    # Make sure required columns exist.
    required = FEATURES + ["Label"]

    missing = [column for column in required if column not in df.columns]

    if missing:
        raise ValueError(
            f"Missing columns in {file_path.name}: {missing}"
        )

    # Keep only the selected features and label.
    df = df[required].copy()

    # Replace infinity values with NaN.
    df.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Convert feature columns to numeric.
    for column in FEATURES:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

    # Remove rows with missing values.
    before = len(df)

    df.dropna(
        subset=FEATURES + ["Label"],
        inplace=True
    )

    removed = before - len(df)

    if removed:
        print(f"Removed {removed} invalid rows.")

    # Remove duplicate rows.
    before = len(df)

    df.drop_duplicates(inplace=True)

    duplicates = before - len(df)

    if duplicates:
        print(f"Removed {duplicates} duplicate rows.")

    # Clean original labels.
    df["Label"] = (
        df["Label"]
        .astype(str)
        .str.strip()
    )

    # Convert CICIDS2017 labels to NetShield binary labels.
    df["traffic_label"] = np.where(
        df["Label"].str.upper() == "BENIGN",
        "Normal",
        "Attack"
    )

    # Keep original attack name as well as binary label.
    df.rename(
        columns={"Label": "original_label"},
        inplace=True
    )

    print(f"Rows after preprocessing: {len(df)}")

    print(
        "Labels:",
        df["traffic_label"].value_counts().to_dict()
    )

    return df


def main():
    print("=" * 60)
    print("NetShield AI - CICIDS2017 Preprocessing")
    print("=" * 60)

    if not INPUT_DIR.exists():
        raise FileNotFoundError(
            f"CICIDS2017 directory not found: {INPUT_DIR}"
        )

    files = sorted(INPUT_DIR.glob("*.csv"))

    if not files:
        raise FileNotFoundError(
            f"No CSV files found in: {INPUT_DIR}"
        )

    print(f"\nFound {len(files)} CICIDS2017 CSV files.")

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    processed_parts = []

    for file_path in files:
        processed = preprocess_file(file_path)
        processed_parts.append(processed)

    print("\nCombining processed files...")

    final_df = pd.concat(
        processed_parts,
        ignore_index=True
    )

    # Final duplicate removal across all files.
    final_df.drop_duplicates(inplace=True)

    # Save processed dataset.
    final_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)

    print(f"Output file: {OUTPUT_FILE}")
    print(f"Rows: {len(final_df)}")
    print(f"Columns: {len(final_df.columns)}")

    print("\nFinal label distribution:")
    print(final_df["traffic_label"].value_counts())

    print("\nOriginal attack distribution:")
    print(final_df["original_label"].value_counts())

    print("\nSaved successfully.")


if __name__ == "__main__":
    main()