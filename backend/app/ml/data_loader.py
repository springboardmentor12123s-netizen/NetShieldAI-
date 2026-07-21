
"""
Dataset loading for benchmark intrusion-detection datasets.

Milestone 1 requirement: "Load CICIDS2017 and UNSW-NB15 datasets."

Real CICIDS2017 / UNSW-NB15 CSVs are large (multi-GB) and not shipped with
this repo. Drop the official CSV files into backend/data/raw/ (see the
README there for expected filenames + download links) and this loader will
read + normalize them into the same feature schema used everywhere else in
the pipeline. If no file is found, it transparently falls back to the
synthetic generator so the rest of the platform keeps working out of the box.
"""
from pathlib import Path
import pandas as pd

from app.ml.synthetic_traffic import generate_flows

RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"

# Common CICIDS2017 column names -> our canonical schema
CICIDS_COLUMN_MAP = {
    "Flow Duration": "duration",
    "Total Fwd Packets": "packet_count",
    "Total Length of Fwd Packets": "byte_count",
    "Flow Packets/s": "packets_per_second",
    "Flow Bytes/s": "bytes_per_second",
    "Destination Port": "dst_port",
    "Label": "label",
}

# Common UNSW-NB15 column names -> our canonical schema
UNSW_COLUMN_MAP = {
    "dur": "duration",
    "spkts": "packet_count",
    "sbytes": "byte_count",
    "dpkts": "dst_packet_count",
    "dbytes": "dst_byte_count",
    "dsport": "dst_port",
    "proto": "protocol",
    "attack_cat": "label",
}


def _find_dataset_file(dataset: str) -> Path | None:
    """
    Looks for a matching CSV anywhere under data/raw/ (including subfolders —
    e.g. data/raw/CICIDS2017/CICIDS2017/Clean_CICIDS2017.csv or
    data/raw/UNSW-NB15/UNSW-NB15_c/UNSW_NB15_training-set.csv both work).
    Checked in priority order: a single pre-merged/cleaned file first, then
    the standard per-day / train-test files.
    """
    candidates = {
        "cicids2017": [
            "Clean_CICIDS2017.csv",
            "cicids2017.csv",
            "CICIDS2017.csv",
            "Friday-WorkingHours.csv",
            "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
            "Monday-WorkingHours.pcap_ISCX.csv",
        ],
        "unsw-nb15": [
            "unsw-nb15.csv",
            "UNSW_NB15_training-set.csv",
            "UNSW-NB15.csv",
            "UNSW-NB15_1.csv",
        ],
    }
    for name in candidates.get(dataset, []):
        # exact path first (fast path for the un-nested case)
        direct = RAW_DIR / name
        if direct.exists():
            return direct
        # then search subfolders (handles nested downloads like
        # raw/CICIDS2017/CICIDS2017/... or raw/UNSW-NB15/UNSW-NB15_c/...)
        matches = list(RAW_DIR.rglob(name))
        if matches:
            return matches[0]
    return None


def load_dataset(dataset: str = "synthetic", sample_size: int = 4000) -> pd.DataFrame:
    """
    Returns a normalized DataFrame with at least:
    duration, packet_count, byte_count, packets_per_second, bytes_per_second,
    avg_packet_size, dst_port, protocol, label (benign / attack-type-string)

    Every returned frame also carries a `_dataset_source` column stating
    exactly what was loaded (a real file path, "synthetic", or an explicit
    "<dataset>_fallback_synthetic" marker) — callers should surface this so
    a silent fallback is never mistaken for training on real data.
    """
    dataset = dataset.lower()

    if dataset == "synthetic":
        flows = generate_flows(count=sample_size, anomaly_ratio=0.18)
        df = pd.DataFrame(flows)
        df["_dataset_source"] = "synthetic"
        return df

    if dataset in ("combined", "both", "cicids2017+unsw-nb15"):
        # Split the requested sample size across both benchmark datasets, then
        # concatenate. Each half goes through the same normalization above,
        # so the merged frame is already on the shared feature/label schema.
        half = sample_size // 2
        df_cicids = load_dataset("cicids2017", half)
        df_unsw = load_dataset("unsw-nb15", sample_size - half)
        combined = pd.concat([df_cicids, df_unsw], ignore_index=True, sort=False)
        # shuffle so the classifier/ensemble don't see one dataset then the other in a block
        combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)
        return combined.fillna(0)

    path = _find_dataset_file(dataset)
    if path is None:
        # Graceful fallback so training never hard-fails in dev/demo environments
        flows = generate_flows(count=sample_size, anomaly_ratio=0.18)
        df = pd.DataFrame(flows)
        df["source_note"] = f"{dataset} file not found in data/raw/, used synthetic fallback"
        df["_dataset_source"] = f"{dataset}_fallback_synthetic"
        return df

    df = pd.read_csv(path, low_memory=False)
    df.columns = df.columns.str.strip()  # CICIDS2017 CSVs are notorious for " Label", " Flow Duration", etc.

    # IMPORTANT: take a genuine random sample rather than just the first N
    # rows. These CSVs are often ordered/grouped by attack category or by
    # capture day, so nrows=sample_size at read time would silently hand the
    # model an unrepresentative, imbalanced slice (missing whole attack
    # categories, wildly over/under-representing others).
    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42).reset_index(drop=True)

    # UNSW-NB15's raw CSVs carry both a binary "label" column (0/1) and an
    # "attack_cat" text column. Our column map renames attack_cat -> label
    # for the richer multi-class signal, so drop the raw binary one first —
    # otherwise both end up named "label" and df["label"] returns a
    # DataFrame instead of a Series, breaking every .str call downstream.
    if dataset == "unsw-nb15" and "attack_cat" in df.columns and "label" in df.columns:
        df = df.drop(columns=["label"])

    col_map = CICIDS_COLUMN_MAP if dataset == "cicids2017" else UNSW_COLUMN_MAP
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Safety net: if any other duplicate column names slipped through
    # (different dataset variants, unexpected schemas), keep only the first.
    df = df.loc[:, ~df.columns.duplicated(keep="first")]

    required = ["duration", "packet_count", "byte_count", "packets_per_second", "bytes_per_second"]
    for col in required:
        if col not in df.columns:
            df[col] = 0.0

    if "avg_packet_size" not in df.columns:
        df["avg_packet_size"] = df["byte_count"] / df["packet_count"].replace(0, 1)

    if "label" not in df.columns:
        df["label"] = "benign"

    df["label"] = df["label"].astype(str).str.strip().str.lower()
    df.loc[df["label"].isin(["benign", "normal", "0"]), "label"] = "benign"

    df = df.replace([float("inf"), float("-inf")], 0)
    df = df.fillna(0)
    df["_dataset_source"] = str(path)
    return df