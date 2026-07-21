"""
report_service.py
-----------------
Builds and persists a ThreatReport record after each prediction run.
The report aggregates counts, percentages, risk level, top risky rows,
threat category distribution, and severity distribution into a single
JSON-serialisable dictionary that is also stored in the database.
"""

import json
from datetime import datetime, timezone
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from app.models import ThreatReport


def build_and_save_report(
    output: pd.DataFrame,
    db: Session,
    supervised_metrics: dict | None = None,
) -> ThreatReport:
    """
    Build a ThreatReport from the enriched prediction *output* DataFrame
    and persist it to the database.

    Parameters
    ----------
    output : pd.DataFrame
        Enriched DataFrame that already has ``Prediction``,
        ``Prediction Label``, ``Threat Category``, ``Risk Score``,
        and ``Severity`` columns.
    db : Session
        Active SQLAlchemy database session.
    supervised_metrics : dict | None
        Optional dict with accuracy, precision, recall, f1_score keys
        (populated when the CSV has a Label column).

    Returns
    -------
    ThreatReport
        The persisted ThreatReport ORM instance.
    """
    total = len(output)

    # --- Counts -----------------------------------------------------------
    label_col = output.get("Prediction Label", output.get("Prediction", pd.Series()))
    normal_count = int((label_col == "Normal").sum())
    suspicious_count = int((label_col == "Suspicious").sum())
    attack_count = int((label_col == "Attack").sum())
    # "anomaly_count" includes both Suspicious and Attack rows
    anomaly_count = suspicious_count + attack_count
    anomaly_pct = round(anomaly_count / total * 100, 2) if total > 0 else 0.0

    # --- Risk level -------------------------------------------------------
    if anomaly_pct >= 50:
        risk_level = "Critical"
    elif anomaly_pct >= 25:
        risk_level = "High"
    elif anomaly_pct >= 10:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # --- Threat category summary -----------------------------------------
    category_summary: dict[str, int] = {}
    if "Threat Category" in output.columns:
        category_summary = (
            output["Threat Category"]
            .value_counts()
            .to_dict()
        )

    # --- Severity summary ------------------------------------------------
    severity_summary: dict[str, int] = {}
    if "Severity" in output.columns:
        severity_summary = (
            output["Severity"]
            .value_counts()
            .to_dict()
        )

    # --- Top risky rows (up to 20) ----------------------------------------
    top_risky: list[dict[str, Any]] = []
    if "Risk Score" in output.columns:
        risky_df = output.nlargest(20, "Risk Score")[
            [c for c in ["Prediction Label", "Threat Category", "Risk Score", "Severity"]
             if c in output.columns]
        ]
        risky_df = risky_df.reset_index()
        # Rename 'index' to 'row_number' (1-based)
        risky_df = risky_df.rename(columns={"index": "row_number"})
        risky_df["row_number"] = risky_df["row_number"] + 1
        top_risky = risky_df.to_dict(orient="records")

    # --- Assemble report dict ---------------------------------------------
    report_dict: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_records": total,
        "normal_count": normal_count,
        "suspicious_count": suspicious_count,
        "attack_count": attack_count,
        "anomaly_count": anomaly_count,
        "anomaly_percentage": anomaly_pct,
        "risk_level": risk_level,
        "threat_category_summary": category_summary,
        "severity_summary": severity_summary,
        "top_risky_rows": top_risky,
    }
    if supervised_metrics:
        report_dict["supervised_metrics"] = supervised_metrics

    # --- Persist to database ----------------------------------------------
    report = ThreatReport(
        total_records=total,
        normal_count=normal_count,
        suspicious_count=suspicious_count,
        anomaly_count=anomaly_count,
        anomaly_percentage=anomaly_pct,
        risk_level=risk_level,
        accuracy=supervised_metrics.get("accuracy") if supervised_metrics else None,
        precision=supervised_metrics.get("precision") if supervised_metrics else None,
        recall=supervised_metrics.get("recall") if supervised_metrics else None,
        f1_score=supervised_metrics.get("f1_score") if supervised_metrics else None,
        report_json=json.dumps(report_dict),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
