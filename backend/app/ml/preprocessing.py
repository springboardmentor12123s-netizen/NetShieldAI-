
"""
Feature engineering shared by both the unsupervised anomaly ensemble and the
supervised Random Forest classifier. Keeping one preprocessing path ensures
train-time and inference-time features never drift apart.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Base numeric flow-volume features (always present, dataset-agnostic).
NUMERIC_FEATURE_COLUMNS = [
    "duration",
    "packet_count",
    "byte_count",
    "dst_packet_count",   # backward/destination-side packet count — separates
    "dst_byte_count",     # symmetric browsing traffic from one-sided attacks
    "packets_per_second", # (DoS floods, exfiltration, port scans)
    "bytes_per_second",
    "avg_packet_size",
    "dst_port",           # many attacks target specific ports (22, 3389, 445...)
]

# One-hot protocol columns, appended after numeric features.
PROTOCOL_COLUMNS = ["protocol_tcp", "protocol_udp", "protocol_icmp"]

FEATURE_COLUMNS = NUMERIC_FEATURE_COLUMNS + PROTOCOL_COLUMNS

_PROTOCOL_NUMERIC_MAP = {"6": "tcp", "17": "udp", "1": "icmp"}


def _normalize_protocol(series: pd.Series) -> pd.Series:
    """Handles CICIDS2017's numeric IANA protocol codes (6/17/1 — sometimes
    read as floats like 6.0 when the column has missing values elsewhere),
    UNSW-NB15's lowercase string protocol names, and anything else — always
    resolves to one of 'tcp' / 'udp' / 'icmp' (default 'tcp' when
    unrecognized/missing)."""
    numeric = pd.to_numeric(series, errors="coerce")
    as_int_str = numeric.dropna().astype(int).astype(str)
    normalized = series.astype(str).str.strip().str.lower()
    normalized.loc[as_int_str.index] = as_int_str.map(_PROTOCOL_NUMERIC_MAP).fillna(normalized.loc[as_int_str.index])
    normalized = normalized.replace(_PROTOCOL_NUMERIC_MAP)
    normalized = normalized.where(normalized.isin(["tcp", "udp", "icmp"]), "tcp")
    return normalized


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """Coerce raw flow rows into a clean numeric feature matrix."""
    work = df.copy()

    for col in NUMERIC_FEATURE_COLUMNS:
        if col not in work.columns:
            work[col] = 0.0
        work[col] = pd.to_numeric(work[col], errors="coerce").fillna(0.0)

    # Guard against divide-by-zero / dataset outliers blowing up the scaler
    work[NUMERIC_FEATURE_COLUMNS] = work[NUMERIC_FEATURE_COLUMNS].clip(lower=0)
    work["packets_per_second"] = work["packets_per_second"].clip(upper=1_000_000)
    work["bytes_per_second"] = work["bytes_per_second"].clip(upper=1_000_000_000)
    work["dst_port"] = work["dst_port"].clip(upper=65535)

    protocol_source = work["protocol"] if "protocol" in work.columns else pd.Series(["tcp"] * len(work))
    normalized_protocol = _normalize_protocol(protocol_source)
    work["protocol_tcp"] = (normalized_protocol == "tcp").astype(float)
    work["protocol_udp"] = (normalized_protocol == "udp").astype(float)
    work["protocol_icmp"] = (normalized_protocol == "icmp").astype(float)

    return work[FEATURE_COLUMNS]


def fit_scaler(feature_df: pd.DataFrame) -> StandardScaler:
    scaler = StandardScaler()
    scaler.fit(feature_df.values)
    return scaler


def transform(feature_df: pd.DataFrame, scaler: StandardScaler) -> np.ndarray:
    return scaler.transform(feature_df.values)


def binary_labels(label_series: pd.Series) -> np.ndarray:
    """benign -> 0, anything else -> 1 (used to evaluate the anomaly ensemble)."""
    return (label_series.astype(str).str.lower() != "benign").astype(int).values