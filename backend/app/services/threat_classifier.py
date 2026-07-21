"""
threat_classifier.py
---------------------
Simple rule-based, explainable threat classifier for NetShield AI.
Classifies each prediction row based on the anomaly flag and available
network flow columns (Destination Port, Flow Bytes/s, Flow Packets/s).

All rules are intentionally transparent so that results can be easily
explained in a college project context.
"""

import pandas as pd

# Thresholds chosen to be representative of known attack patterns in
# CICIDS2017-style data.  They are deliberately simple and adjustable.
_HIGH_BYTES_THRESHOLD = 100_000   # Flow Bytes/s
_HIGH_PACKETS_THRESHOLD = 1_000  # Flow Packets/s


def classify_threats(output: pd.DataFrame) -> pd.Series:
    """
    Classify each row in *output* into a threat category.

    Parameters
    ----------
    output : pd.DataFrame
        Must contain at least a ``Prediction`` column whose values are
        ``"Normal"`` or ``"Anomaly"``.  Optional columns used for
        rule evaluation: ``Destination Port``, ``Flow Bytes/s``,
        ``Flow Packets/s``.

    Returns
    -------
    pd.Series
        String threat category for each row.
    """

    def _classify_row(row: pd.Series) -> str:
        if row.get("Prediction", "Normal") != "Anomaly":
            return "Normal Traffic"

        dest_port = _safe_int(row, "Destination Port")
        flow_bytes = _safe_float(row, "Flow Bytes/s")
        flow_packets = _safe_float(row, "Flow Packets/s")

        # Rule 1 – DDoS: very high bytes AND packets per second
        if flow_bytes > _HIGH_BYTES_THRESHOLD and flow_packets > _HIGH_PACKETS_THRESHOLD:
            return "Possible DDoS"

        # Rule 2 – SSH brute-force / scan
        if dest_port == 22:
            return "Possible SSH Attack"

        # Rule 3 – Web / HTTPS attack
        if dest_port in (80, 443):
            return "Possible Web Attack"

        # Rule 4 – DNS anomaly
        if dest_port == 53:
            return "Possible DNS Anomaly"

        return "Generic Network Anomaly"

    return output.apply(_classify_row, axis=1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_int(row: pd.Series, col: str, default: int = -1) -> int:
    try:
        return int(row[col])
    except (KeyError, ValueError, TypeError):
        return default


def _safe_float(row: pd.Series, col: str, default: float = 0.0) -> float:
    try:
        val = float(row[col])
        return val if val == val else default  # NaN guard
    except (KeyError, ValueError, TypeError):
        return default
