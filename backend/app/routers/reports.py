import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ThreatReport

router = APIRouter(tags=["Reports"])


@router.get("/reports/latest")
def get_latest_report(db: Session = Depends(get_db)):
    """
    Return the most recently generated threat analysis report.
    The report is produced automatically after each successful prediction run.
    """
    report = db.scalars(
        select(ThreatReport).order_by(ThreatReport.generated_at.desc())
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="No threat report found. Run a prediction first to generate a report.",
        )

    # Deserialise the stored JSON payload (contains top rows, category breakdown, etc.)
    report_data: dict = {}
    if report.report_json:
        try:
            report_data = json.loads(report.report_json)
        except (json.JSONDecodeError, ValueError):
            report_data = {}

    return {
        "id": report.id,
        "generated_at": report.generated_at,
        "total_records": report.total_records,
        "normal_count": report.normal_count,
        "suspicious_count": report.suspicious_count,
        "anomaly_count": report.anomaly_count,
        "anomaly_percentage": report.anomaly_percentage,
        "risk_level": report.risk_level,
        # Supervised metrics – present only when the prediction CSV had labels
        "accuracy": report.accuracy,
        "precision": report.precision,
        "recall": report.recall,
        "f1_score": report.f1_score,
        # Rich report detail from the JSON blob
        "threat_category_summary": report_data.get("threat_category_summary", {}),
        "severity_summary": report_data.get("severity_summary", {}),
        "top_risky_rows": report_data.get("top_risky_rows", []),
        "supervised_metrics": report_data.get("supervised_metrics"),
    }
