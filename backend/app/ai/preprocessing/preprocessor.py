"""Preprocessor class for network traffic log feature extraction and scaling."""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any, Tuple


class NetworkTrafficPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False
        
        # Consistent feature list order
        self.feature_cols = [
            "src_port",
            "dst_port",
            "bytes_sent",
            "bytes_received",
            "packet_count",
            "duration_ms",
            "proto_code",      # TCP=1, UDP=2, ICMP=3, RDP=4, SSH=5, Others=0
            "flag_count",
            "has_syn",
            "has_ack"
        ]

    def _resolve_proto_code(self, proto: str) -> int:
        p = str(proto).upper().strip()
        if "TCP" in p:
            return 1
        elif "UDP" in p:
            return 2
        elif "ICMP" in p:
            return 3
        elif "RDP" in p:
            return 4
        elif "SSH" in p:
            return 5
        return 0

    def extract_features(self, logs: List[Dict[str, Any]]) -> pd.DataFrame:
        """Transform batch log records to pandas DataFrame of numerical columns."""
        rows = []
        for log in logs:
            proto = log.get("protocol", "TCP")
            flags = log.get("flags", [])
            if not isinstance(flags, list):
                flags = []
                
            has_syn = 1 if "SYN" in [f.upper() for f in flags] else 0
            has_ack = 1 if "ACK" in [f.upper() for f in flags] else 0
            
            rows.append({
                "src_port": int(log.get("src_port") or 0),
                "dst_port": int(log.get("dst_port") or 0),
                "bytes_sent": int(log.get("bytes_sent") or 0),
                "bytes_received": int(log.get("bytes_received") or 0),
                "packet_count": int(log.get("packet_count") or 1),
                "duration_ms": int(log.get("duration_ms") or 0),
                "proto_code": self._resolve_proto_code(proto),
                "flag_count": len(flags),
                "has_syn": has_syn,
                "has_ack": has_ack
            })
            
        df = pd.DataFrame(rows, columns=self.feature_cols)
        return df

    def fit(self, logs: List[Dict[str, Any]]) -> "NetworkTrafficPreprocessor":
        """Fits the StandardScaler on continuous features."""
        df = self.extract_features(logs)
        continuous_cols = ["bytes_sent", "bytes_received", "packet_count", "duration_ms"]
        self.scaler.fit(df[continuous_cols])
        self.is_fitted = True
        return self

    def transform(self, logs: List[Dict[str, Any]]) -> np.ndarray:
        """Transforms logs into standardized numpy array."""
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet.")
            
        df = self.extract_features(logs)
        
        # Scaling numerical continuous columns
        continuous_cols = ["bytes_sent", "bytes_received", "packet_count", "duration_ms"]
        df[continuous_cols] = self.scaler.transform(df[continuous_cols])
        
        return df.to_numpy()

    def fit_transform(self, logs: List[Dict[str, Any]]) -> np.ndarray:
        """Fit and transform logs in one pass."""
        self.fit(logs)
        return self.transform(logs)

    def extract_labels(self, logs: List[Dict[str, Any]]) -> np.ndarray:
        """Map dataset labels into numerical categories for supervised RandomForest.
        
        Categories:
          0: Normal / BENIGN
          1: PortScan
          2: DDoS
          3: Exploits
          4: DoS
          5: Fuzzers
          6: Other
        """
        labels = []
        for log in logs:
            meta = log.get("metadata") or {}
            
            # Gather potential label fields from ingestion metadata
            dataset = str(meta.get("dataset", "")).upper()
            raw_label = str(meta.get("label", "")).upper()
            raw_cat = str(meta.get("attack_category", "")).upper()
            
            # Map
            if "BENIGN" in raw_label or "NORMAL" in raw_cat:
                labels.append(0)
            elif "PORTSCAN" in raw_label or "PORT SCAN" in raw_label:
                labels.append(1)
            elif "DDOS" in raw_label or "DDOS" in raw_cat:
                labels.append(2)
            elif "EXPLOIT" in raw_cat or "EXPLOITS" in raw_cat:
                labels.append(3)
            elif "DOS" in raw_cat or "DENIAL OF SERVICE" in raw_label:
                labels.append(4)
            elif "FUZZER" in raw_cat or "FUZZERS" in raw_cat:
                labels.append(5)
            else:
                # Check binary labels or other anomaly logs
                label_binary = meta.get("label_binary")
                if label_binary is not None:
                    # In UNSW, 1 is threat, 0 is normal. If threat but no category matched
                    if int(label_binary) == 1:
                        labels.append(6) # Other
                    else:
                        labels.append(0)
                else:
                    if raw_label != "" and raw_label != "NONE":
                        labels.append(6) # Other threat
                    else:
                        labels.append(0) # Default normal
                        
        return np.array(labels, dtype=int)
