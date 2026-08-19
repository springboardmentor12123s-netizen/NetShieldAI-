"""
NetShield AI - UNSW-NB15 Preprocessing

Reads the UNSW-NB15 training and testing datasets,
cleans the data, selects useful network-flow features,
and creates a common processed dataset for NetShield AI.
"""

from pathlib import Path

import pandas as pd


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

INPUT_DIR = BASE_DIR / "data" / "UNSW-NB15"
OUTPUT_DIR = BASE_DIR / "data" / "processed"

TRAIN_FILE = INPUT_DIR / "UNSW_NB15_training-set.csv"
TEST_FILE = INPUT_DIR / "UNSW_NB15_testing-set.csv"

OUTPUT_FILE = OUTPUT_DIR / "unsw_nb15_processed.csv"


# ---------------------------------------------------------
# Features
# ---------------------------------------------------------

# Common network-flow representation used by NetShield AI
FEATURE_COLUMNS = [
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
]


# ---------------------------------------------------------
# Load and transform
# ---------------------------------------------------------

def process_file(file_path: Path) -> pd.DataFrame:

    print(f"\nReading: {file_path.name}")

    df = pd.read_csv(file_path)

    print(f"Original rows: {len(df)}")
    print(f"Original columns: {len(df.columns)}")

    # Remove whitespace from column names
    df.columns = df.columns.str.strip()

    # -----------------------------------------------------
    # Create common feature representation
    # -----------------------------------------------------

    processed = pd.DataFrame()

    # Duration
    processed["duration"] = pd.to_numeric(
        df["dur"], errors="coerce"
    )

    # Protocol
    processed["protocol_type"] = df["proto"].astype(str)

    # Source bytes
    processed["src_bytes"] = pd.to_numeric(
        df["sbytes"], errors="coerce"
    )

    # Destination bytes
    processed["dst_bytes"] = pd.to_numeric(
        df["dbytes"], errors="coerce"
    )

    # Total packets
    processed["packet_count"] = (
        pd.to_numeric(df["spkts"], errors="coerce").fillna(0)
        +
        pd.to_numeric(df["dpkts"], errors="coerce").fillna(0)
    )

    # Network flow rate
    processed["flow_rate"] = pd.to_numeric(
        df["rate"], errors="coerce"
    )

    # UNSW does not have the same wrong_fragment field
    processed["wrong_fragment"] = 0

    # UNSW does not have the same urgent field
    processed["urgent"] = 0

    # Network connection count
    processed["count"] = pd.to_numeric(
        df["ct_src_ltm"], errors="coerce"
    )

    # Service count
    processed["srv_count"] = pd.to_numeric(
        df["ct_srv_src"], errors="coerce"
    )

    # -----------------------------------------------------
    # Label
    # -----------------------------------------------------

    processed["label"] = df["label"].map({
        0: "normal",
        1: "attack"
    })

    # Keep original attack category
    processed["original_attack_category"] = (
        df["attack_cat"]
        .fillna("Normal")
        .astype(str)
        .str.strip()
    )

    # -----------------------------------------------------
    # Clean data
    # -----------------------------------------------------

    before = len(processed)

    processed = processed.replace(
        [float("inf"), float("-inf")],
        pd.NA
    )

    processed = processed.dropna(
        subset=FEATURE_COLUMNS + ["label"]
    )

    processed = processed.drop_duplicates()

    removed = before - len(processed)

    print(f"Removed invalid/duplicate rows: {removed}")
    print(f"Rows after preprocessing: {len(processed)}")

    print("\nLabels:")
    print(processed["label"].value_counts().to_dict())

    return processed


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

def main():

    print("=" * 60)
    print("NetShield AI - UNSW-NB15 Preprocessing")
    print("=" * 60)

    if not TRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Training dataset not found:\n{TRAIN_FILE}"
        )

    if not TEST_FILE.exists():
        raise FileNotFoundError(
            f"Testing dataset not found:\n{TEST_FILE}"
        )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    print("\nProcessing training dataset...")
    train_df = process_file(TRAIN_FILE)

    print("\nProcessing testing dataset...")
    test_df = process_file(TEST_FILE)

    # -----------------------------------------------------
    # Combine
    # -----------------------------------------------------

    print("\nCombining training and testing datasets...")

    combined = pd.concat(
        [train_df, test_df],
        ignore_index=True
    )

    combined = combined.drop_duplicates()

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    combined.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)

    print(f"Output file: {OUTPUT_FILE}")
    print(f"Rows: {len(combined)}")
    print(f"Columns: {len(combined.columns)}")

    print("\nFinal label distribution:")
    print(combined["label"].value_counts())

    print("\nAttack category distribution:")
    print(combined["original_attack_category"].value_counts())

    print("\nSaved successfully.")


if __name__ == "__main__":
    main()