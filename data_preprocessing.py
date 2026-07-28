import glob
import os
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler


DATA_DIR = r"C:\Users\chand\Downloads\archive"

# This dataset variant (payload-byte based) uses lowercase "label"
LABEL_COLUMN = "label"

# Columns to drop that aren't real traffic features, if present in your file.
COLUMNS_TO_DROP = ["Flow ID", "Source IP", "Destination IP", "Timestamp"]

CHUNK_SIZE = 200_000
SAMPLE_FRACTION = 0.05  

# Start small to test, then raise for a more accurate model.
MAX_ROWS = 20000


def load_raw_dataset(data_dir: str = DATA_DIR) -> pd.DataFrame:
    """Reads the whole file in chunks, sampling a small fraction of EVERY
    chunk (not just the start) so files ordered by day/time still get a
    representative mix of classes. Then trims down to MAX_ROWS if set."""
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    if not csv_files:
        raise FileNotFoundError(
            f"No CSV files found in '{data_dir}'. "
            f"Update DATA_DIR in data_preprocessing.py to point to your dataset folder."
        )

    print(f"Found {len(csv_files)} CSV file(s): {csv_files}")
    frames = []
    for f in csv_files:
        print(f"Reading {f} in chunks of {CHUNK_SIZE}...")
        for chunk in pd.read_csv(f, low_memory=False, chunksize=CHUNK_SIZE):
            if SAMPLE_FRACTION < 1.0:
                chunk = chunk.sample(frac=SAMPLE_FRACTION, random_state=42)
            frames.append(chunk)

    df = pd.concat(frames, ignore_index=True)
    df.columns = df.columns.str.strip()

    if MAX_ROWS is not None and len(df) > MAX_ROWS:
        df = df.sample(n=MAX_ROWS, random_state=42).reset_index(drop=True)

    print(f"Loaded {len(df)} rows total (sampled across the whole file).")
    return df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    before = len(df)
    df = df.drop_duplicates()
    df = df.replace([float("inf"), float("-inf")], pd.NA)
    df = df.dropna()
    print(f"Cleaned dataset: {before} -> {len(df)} rows")
    return df


def encode_and_scale(df: pd.DataFrame, label_column: str = LABEL_COLUMN):
    if label_column not in df.columns:
        raise KeyError(
            f"Label column '{label_column}' not found. "
            f"Available columns: {list(df.columns)[:10]}... "
            f"Update LABEL_COLUMN in data_preprocessing.py."
        )

    y_raw = df[label_column]
    X = df.drop(columns=[label_column])
    X = X.drop(columns=[c for c in COLUMNS_TO_DROP if c in X.columns], errors="ignore")
    X = X.select_dtypes(include=["number"])

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, label_encoder, scaler, X.columns.tolist()


if __name__ == "__main__":
    raw_df = load_raw_dataset()
    clean_df = clean_dataset(raw_df)
    X, y, le, scaler, feature_names = encode_and_scale(clean_df)
    print("X shape:", X.shape)
    print("Classes found:", list(le.classes_))