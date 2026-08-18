import pandas as pd
from sqlalchemy.orm import Session

from app.models.traffic import TrafficRecord
from app.models.anomaly import AnomalyResult
from app.models.alert import Alert
from app.ml.pipeline import pipeline_singleton
from app.services.email_notifier import send_alert_email


def score_records(db: Session, records: list[TrafficRecord]):
    """
    Shared scoring logic used by both the manual /anomaly/score endpoint
    and the automatic live-capture background scorer.
    Returns list of saved AnomalyResult objects, or None if no model is trained yet.
    """
    if not records:
        return []

    df = pd.DataFrame([{
    "duration": r.duration,
    "packet_count": r.packet_count,
    "byte_count": r.byte_count,
    "packets_per_second": r.packets_per_second,
    "bytes_per_second": r.bytes_per_second,
    "avg_packet_size": r.avg_packet_size,
} for r in records])

    try:
        scored = pipeline_singleton.score_flows(df)
    except RuntimeError:
        return None

    saved_results = []
    for record, score in zip(records, scored):
        anomaly_result = AnomalyResult(
            traffic_record_id=record.id,
            **score,
        )
        db.add(anomaly_result)
        record.is_processed = True

        if score["risk_level"] in ("high", "critical"):
            db.flush()
            alert = Alert(
                anomaly_result_id=anomaly_result.id,
                title=f"{score['predicted_attack_type'].replace('_', ' ').title()} detected from {record.src_ip}",
                description=(
                    f"Flow {record.src_ip}:{record.src_port} -> {record.dst_ip}:{record.dst_port} "
                    f"flagged with risk score {score['risk_score']}."
                ),
                severity=score["risk_level"],
                risk_score=score["risk_score"],
            )
            db.add(alert)

            if score["risk_level"] == "critical":
                send_alert_email(
                    alert_title=alert.title,
                    description=alert.description,
                    severity=alert.severity,
                    risk_score=alert.risk_score,
                )

        saved_results.append(anomaly_result)

    db.commit()
    for r in saved_results:
        db.refresh(r)

    return saved_results