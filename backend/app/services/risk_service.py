"""
risk_service.py
---------------
Generates a risk score (0–100) and derived labels for each prediction row.

Risk scoring approach
~~~~~~~~~~~~~~~~~~~~~
* Normal rows receive a base score of 0–30 (low risk).
* Anomaly rows receive a base score of 50, then the score is boosted by
  normalised values of flow-level features that are indicative of attack
  traffic intensity.  The maximum possible score is 100.

Severity buckets
~~~~~~~~~~~~~~~~
  Low      0 – 30
  Medium  31 – 60
  High    61 – 80
  Critical 81 – 100

Prediction labels
~~~~~~~~~~~~~~~~~
  Normal     – Isolation Forest says normal
  Suspicious – Anomaly with risk score ≤ 70
  Attack     – Anomaly with risk score > 70
"""

import numpy as np
import pandas as pd

# Feature weights used to boost the raw anomaly score.
# Only features present in the DataFrame are used; missing ones are skipped.
_FEATURE_WEIGHTS: dict[str, float] = {
    "Flow Bytes/s": 0.30,
    "Flow Packets/s": 0.25,
    "Flow Duration": 0.15,
    "Packet Length Mean": 0.15,
    "Average Packet Size": 0.15,
}

# Caps used for percentile-based normalisation (avoids extreme outlier dominance).
_NORMALISE_CAP = 99  # percentile used as the normalisation ceiling


def compute_risk(output: pd.DataFrame) -> pd.DataFrame:
    """
    Append ``Risk Score``, ``Severity``, and ``Prediction Label`` columns
    to *output* (in-place copy returned).

    Parameters
    ----------
    output : pd.DataFrame
        Must contain a ``Prediction`` column with ``"Normal"`` / ``"Anomaly"``.

    Returns
    -------
    pd.DataFrame
        A copy of *output* with three additional columns.
    """
    df = output.copy()
    is_anomaly = (df["Prediction"] == "Anomaly").astype(float)

    # ------------------------------------------------------------------
    # Build a combined feature boost for anomaly rows (0–50 range)
    # ------------------------------------------------------------------
    boost = pd.Series(np.zeros(len(df)), index=df.index)
    for feature, weight in _FEATURE_WEIGHTS.items():
        if feature not in df.columns:
            continue
        col = pd.to_numeric(df[feature], errors="coerce").fillna(0)
        col = col.clip(lower=0)
        cap = np.percentile(col[col > 0], _NORMALISE_CAP) if (col > 0).any() else 1.0
        cap = cap if cap > 0 else 1.0
        normalised = (col / cap).clip(0, 1)
        boost += normalised * weight * 50  # scale to 0–50

    # Base score: normal → 0–25 range  |  anomaly → 50 + boost (capped at 100)
    normal_noise = np.random.default_rng(42).uniform(0, 25, size=len(df))
    raw_score = np.where(
        is_anomaly.to_numpy() == 1,
        np.clip(50 + boost.to_numpy(), 50, 100),
        normal_noise,
    )
    df["Risk Score"] = np.round(raw_score).astype(int)

    # ------------------------------------------------------------------
    # Severity
    # ------------------------------------------------------------------
    def _severity(score: int) -> str:
        if score <= 30:
            return "Low"
        if score <= 60:
            return "Medium"
        if score <= 80:
            return "High"
        return "Critical"

    df["Severity"] = df["Risk Score"].apply(_severity)

    # ------------------------------------------------------------------
    # Prediction Label
    # ------------------------------------------------------------------
    def _label(row: pd.Series) -> str:
        if row["Prediction"] == "Normal":
            return "Normal"
        if row["Risk Score"] > 70:
            return "Attack"
        return "Suspicious"

    df["Prediction Label"] = df.apply(_label, axis=1)

    return df
