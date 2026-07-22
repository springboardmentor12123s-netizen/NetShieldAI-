from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR.parent / "datasets" / "CICIDS2017" / "Monday-WorkingHours.pcap_ISCX.csv"


def load_dataset():
    return pd.read_csv(DATASET_PATH)


def dataset_summary():
    df = load_dataset()

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns)
    }