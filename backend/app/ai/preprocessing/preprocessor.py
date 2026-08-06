"""Preprocessor for CIC-IDS-2017 dataset feature extraction and scaling.

Handles two modes:
1. Training mode: reads features directly from a pandas DataFrame (CSV columns)
2. Inference mode: maps real-time packet dicts to the CIC-IDS feature space
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from typing import List, Dict, Any


# The 78 numeric feature columns from CIC-IDS-2017 (in CSV column order).
# The Label column and any non-numeric columns are excluded.
CICIDS_FEATURE_COLUMNS = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Fwd Packet Length Max",
    "Fwd Packet Length Min",
    "Fwd Packet Length Mean",
    "Fwd Packet Length Std",
    "Bwd Packet Length Max",
    "Bwd Packet Length Min",
    "Bwd Packet Length Mean",
    "Bwd Packet Length Std",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Flow IAT Std",
    "Flow IAT Max",
    "Flow IAT Min",
    "Fwd IAT Total",
    "Fwd IAT Mean",
    "Fwd IAT Std",
    "Fwd IAT Max",
    "Fwd IAT Min",
    "Bwd IAT Total",
    "Bwd IAT Mean",
    "Bwd IAT Std",
    "Bwd IAT Max",
    "Bwd IAT Min",
    "Fwd PSH Flags",
    "Bwd PSH Flags",
    "Fwd URG Flags",
    "Bwd URG Flags",
    "Fwd Header Length",
    "Bwd Header Length",
    "Fwd Packets/s",
    "Bwd Packets/s",
    "Min Packet Length",
    "Max Packet Length",
    "Packet Length Mean",
    "Packet Length Std",
    "Packet Length Variance",
    "FIN Flag Count",
    "SYN Flag Count",
    "RST Flag Count",
    "PSH Flag Count",
    "ACK Flag Count",
    "URG Flag Count",
    "CWE Flag Count",
    "ECE Flag Count",
    "Down/Up Ratio",
    "Average Packet Size",
    "Avg Fwd Segment Size",
    "Avg Bwd Segment Size",
    "Fwd Header Length",  # Note: appears twice in CIC-IDS-2017 schema
    "Fwd Avg Bytes/Bulk",
    "Fwd Avg Packets/Bulk",
    "Fwd Avg Bulk Rate",
    "Bwd Avg Bytes/Bulk",
    "Bwd Avg Packets/Bulk",
    "Bwd Avg Bulk Rate",
    "Subflow Fwd Packets",
    "Subflow Fwd Bytes",
    "Subflow Bwd Packets",
    "Subflow Bwd Bytes",
    "Init_Win_bytes_forward",
    "Init_Win_bytes_backward",
    "act_data_pkt_fwd",
    "min_seg_size_forward",
    "Active Mean",
    "Active Std",
    "Active Max",
    "Active Min",
    "Idle Mean",
    "Idle Std",
    "Idle Max",
    "Idle Min",
]

# Consolidated label mapping for CIC-IDS-2017 attack types
LABEL_MAP = {
    "BENIGN": 0,
    "PortScan": 1,
    "DDoS": 2,
    "DoS Hulk": 3,
    "DoS GoldenEye": 3,
    "DoS slowloris": 3,
    "DoS Slowhttptest": 3,
    "FTP-Patator": 4,
    "SSH-Patator": 4,
    "Web Attack \u0013 Brute Force": 5,
    "Web Attack \u0013 XSS": 5,
    "Web Attack \u0013 Sql Injection": 5,
    "Web Attack – Brute Force": 5,
    "Web Attack – XSS": 5,
    "Web Attack – Sql Injection": 5,
    "Bot": 6,
    "Heartbleed": 7,
    "Infiltration": 7,
}

CATEGORY_NAMES = {
    0: "Normal",
    1: "PortScan",
    2: "DDoS",
    3: "DoS",
    4: "Brute Force",
    5: "Web Attack",
    6: "Bot",
    7: "Other Threat",
}


class NetworkTrafficPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.n_features = None  # Set after fitting

    # ------------------------------------------------------------------ #
    #  TRAINING MODE: DataFrame-based (from CSV)
    # ------------------------------------------------------------------ #

    def prepare_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and select feature columns from a raw CIC-IDS-2017 DataFrame."""
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()

        # Handle duplicate column name "Fwd Header Length"
        # Keep only unique columns (pandas will auto-suffix duplicates)
        if df.columns.duplicated().any():
            df = df.loc[:, ~df.columns.duplicated(keep="first")]

        # Build the feature list from available columns
        available_cols = [c for c in CICIDS_FEATURE_COLUMNS if c in df.columns]
        # Deduplicate while preserving order
        seen = set()
        unique_cols = []
        for c in available_cols:
            if c not in seen:
                seen.add(c)
                unique_cols.append(c)

        feature_df = df[unique_cols].copy()

        # Replace inf with NaN, then fill NaN with 0
        feature_df.replace([np.inf, -np.inf], np.nan, inplace=True)
        feature_df.fillna(0, inplace=True)

        # Force numeric
        for col in feature_df.columns:
            feature_df[col] = pd.to_numeric(feature_df[col], errors="coerce").fillna(0)

        return feature_df

    def extract_labels_from_dataframe(self, df: pd.DataFrame) -> np.ndarray:
        """Extract and map labels from the 'Label' column."""
        df.columns = df.columns.str.strip()
        raw_labels = df["Label"].astype(str).str.strip()

        mapped = raw_labels.map(LABEL_MAP)
        # Unmapped attack types → 7 (Other Threat)
        mapped = mapped.fillna(7).astype(int)
        return mapped.values

    def fit_from_dataframe(self, df: pd.DataFrame) -> "NetworkTrafficPreprocessor":
        """Fit scaler on a CIC-IDS-2017 DataFrame."""
        feature_df = self.prepare_dataframe(df)
        self.n_features = feature_df.shape[1]
        self.scaler.fit(feature_df.values)
        self.is_fitted = True
        return self

    def transform_dataframe(self, df: pd.DataFrame) -> np.ndarray:
        """Transform a CIC-IDS-2017 DataFrame using fitted scaler."""
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet.")
        feature_df = self.prepare_dataframe(df)
        return self.scaler.transform(feature_df.values)

    def fit_transform_dataframe(self, df: pd.DataFrame) -> np.ndarray:
        """Fit and transform in one pass."""
        self.fit_from_dataframe(df)
        feature_df = self.prepare_dataframe(df)
        return self.scaler.transform(feature_df.values)

    # ------------------------------------------------------------------ #
    #  INFERENCE MODE: Dict-based (real-time packets)
    # ------------------------------------------------------------------ #

    def _packet_to_feature_vector(self, log: Dict[str, Any]) -> np.ndarray:
        """Map a real-time packet dict to the CIC-IDS feature space.

        Most CIC-IDS flow statistics are unavailable from a single packet,
        so we map available fields and zero-fill the rest.
        """
        flags = log.get("flags", [])
        if not isinstance(flags, list):
            flags = []
        flag_upper = [f.upper() for f in flags]

        bytes_sent = float(log.get("bytes_sent", 0) or 0)
        bytes_received = float(log.get("bytes_received", 0) or 0)
        packet_count = float(log.get("packet_count", 1) or 1)
        duration_ms = float(log.get("duration_ms", 0) or 0)
        dst_port = float(log.get("dst_port", 0) or 0)
        fwd_pkts = max(packet_count / 2, 1)
        bwd_pkts = max(packet_count / 2, 0)

        # Build a sparse feature vector matching the training columns
        # We fill what we can map; the scaler handles normalization
        vec = {
            "Destination Port": dst_port,
            "Flow Duration": duration_ms * 1000,  # ms to microseconds
            "Total Fwd Packets": fwd_pkts,
            "Total Backward Packets": bwd_pkts,
            "Total Length of Fwd Packets": bytes_sent,
            "Total Length of Bwd Packets": bytes_received,
            "Fwd Packet Length Max": bytes_sent / max(fwd_pkts, 1),
            "Fwd Packet Length Min": bytes_sent / max(fwd_pkts, 1),
            "Fwd Packet Length Mean": bytes_sent / max(fwd_pkts, 1),
            "Bwd Packet Length Max": bytes_received / max(bwd_pkts, 1) if bwd_pkts > 0 else 0,
            "Bwd Packet Length Min": bytes_received / max(bwd_pkts, 1) if bwd_pkts > 0 else 0,
            "Bwd Packet Length Mean": bytes_received / max(bwd_pkts, 1) if bwd_pkts > 0 else 0,
            "Flow Bytes/s": (bytes_sent + bytes_received) / max(duration_ms / 1000, 0.001),
            "Flow Packets/s": packet_count / max(duration_ms / 1000, 0.001),
            "SYN Flag Count": 1.0 if "SYN" in flag_upper else 0.0,
            "ACK Flag Count": 1.0 if "ACK" in flag_upper else 0.0,
            "FIN Flag Count": 1.0 if "FIN" in flag_upper else 0.0,
            "RST Flag Count": 1.0 if "RST" in flag_upper else 0.0,
            "PSH Flag Count": 1.0 if "PSH" in flag_upper else 0.0,
            "URG Flag Count": 1.0 if "URG" in flag_upper else 0.0,
            "Average Packet Size": (bytes_sent + bytes_received) / max(packet_count, 1),
            "Avg Fwd Segment Size": bytes_sent / max(fwd_pkts, 1),
            "Avg Bwd Segment Size": bytes_received / max(bwd_pkts, 1) if bwd_pkts > 0 else 0,
            "Subflow Fwd Packets": fwd_pkts,
            "Subflow Fwd Bytes": bytes_sent,
            "Subflow Bwd Packets": bwd_pkts,
            "Subflow Bwd Bytes": bytes_received,
            "Min Packet Length": min(bytes_sent / max(fwd_pkts, 1),
                                     bytes_received / max(bwd_pkts, 1) if bwd_pkts > 0 else float("inf")),
            "Max Packet Length": max(bytes_sent / max(fwd_pkts, 1),
                                     bytes_received / max(bwd_pkts, 1) if bwd_pkts > 0 else 0),
            "Packet Length Mean": (bytes_sent + bytes_received) / max(packet_count, 1),
        }

        return vec

    def transform(self, logs: List[Dict[str, Any]]) -> np.ndarray:
        """Transform real-time packet dicts into feature arrays for inference."""
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet.")

        # Get the feature column names from the fitted scaler
        # We use the same order as during training
        feature_names = list(dict.fromkeys(
            c for c in CICIDS_FEATURE_COLUMNS
        ))[:self.n_features]

        rows = []
        for log in logs:
            vec_dict = self._packet_to_feature_vector(log)
            row = [float(vec_dict.get(col, 0.0)) for col in feature_names]
            rows.append(row)

        X = np.array(rows, dtype=np.float64)
        return self.scaler.transform(X)

    # Legacy compatibility
    def fit_transform(self, logs: List[Dict[str, Any]]) -> np.ndarray:
        """Legacy: fit_transform from dict logs (builds a minimal DataFrame)."""
        return self.transform(logs)

    def extract_labels(self, logs: List[Dict[str, Any]]) -> np.ndarray:
        """Extract labels from dict-based logs (legacy/inference use)."""
        labels = []
        for log in logs:
            meta = log.get("metadata") or {}
            raw_label = str(meta.get("label", "BENIGN")).strip()
            labels.append(LABEL_MAP.get(raw_label, 0))
        return np.array(labels, dtype=int)
