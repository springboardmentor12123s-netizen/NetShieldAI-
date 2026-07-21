"""
Anomaly Detection Module + Intrusion Prediction Module (Milestone 2).

- POST /train   -> trains the unsupervised ensemble + supervised classifier
                    on a chosen dataset, persists metrics as a DetectionModelRun
- POST /score    -> scores all not-yet-processed TrafficRecords, writes
                    AnomalyResult rows, and auto-creates Alerts for high/critical risk
- GET  /results  -> lists scored results
- GET  /report   -> aggregate summary (used by "Generate anomaly detection reports")
- GET  /model-runs -> training history / evaluation metrics
"""
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.traffic import TrafficRecord
from app.models.anomaly import AnomalyResult, DetectionModelRun
from app.models.alert import Alert
from app.schemas.anomaly import (
    TrainRequest, ScoreRequest, AnomalyResultOut, DetectionModelRunOut, AnomalyReportSummary,
)
from app.auth.dependencies import get_current_user
from app.ml.pipeline import pipeline_singleton
from app.utils.audit import log_action

router = APIRouter(prefix="/api/anomaly", tags=["Anomaly Detection & Intrusion Prediction"])


@router.post("/train")
def train_models(
    payload: TrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = pipeline_singleton.train(dataset=payload.dataset, sample_size=payload.sample_size)

    ensemble_metrics = result["anomaly_ensemble_metrics"]
    run = DetectionModelRun(
        model_name="isolation_forest_ocsvm_ensemble",
        dataset_used=payload.dataset,
        accuracy=ensemble_metrics["accuracy"],
        precision=ensemble_metrics["precision"],
        recall=ensemble_metrics["recall"],
        f1_score=ensemble_metrics["f1_score"],
        metrics_json=result,
    )
    db.add(run)

    if result["classifier_metrics"]:
        cm = result["classifier_metrics"]
        clf_run = DetectionModelRun(
            model_name="random_forest_classifier",
            dataset_used=payload.dataset,
            accuracy=cm["accuracy"],
            precision=cm["precision"],
            recall=cm["recall"],
            f1_score=cm["f1_score"],
            metrics_json=cm,
        )
        db.add(clf_run)

    db.commit()
    log_action(db, current_user.id, "MODEL_TRAINED", f"Trained on dataset={payload.dataset}, n={result['sample_size']}")
    return result


@router.post("/score", response_model=list[AnomalyResultOut])
def score_traffic(
    payload: ScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unprocessed = (
        db.query(TrafficRecord)
        .filter(TrafficRecord.is_processed == False)  # noqa: E712
        .limit(payload.limit)
        .all()
    )
    if not unprocessed:
        return []

    df = pd.DataFrame([{
        "duration": r.duration,
        "packet_count": r.packet_count,
        "byte_count": r.byte_count,
        "packets_per_second": r.packets_per_second,
        "bytes_per_second": r.bytes_per_second,
        "avg_packet_size": r.avg_packet_size,
    } for r in unprocessed])

    try:
        scored = pipeline_singleton.score_flows(df)
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e))

    saved_results = []
    for record, score in zip(unprocessed, scored):
        anomaly_result = AnomalyResult(
            traffic_record_id=record.id,
            **score,
        )
        db.add(anomaly_result)
        record.is_processed = True

        if score["risk_level"] in ("high", "critical"):
            db.flush()  # ensure anomaly_result.id is available
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

        saved_results.append(anomaly_result)

    db.commit()
    for r in saved_results:
        db.refresh(r)

    log_action(db, current_user.id, "TRAFFIC_SCORED", f"Scored {len(saved_results)} flows")
    return saved_results


@router.get("/results", response_model=list[AnomalyResultOut])
def list_results(
    limit: int = 100,
    only_anomalies: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AnomalyResult).order_by(AnomalyResult.created_at.desc())
    if only_anomalies:
        query = query.filter(AnomalyResult.is_anomaly == 1)
    return query.limit(limit).all()


@router.get("/report", response_model=AnomalyReportSummary)
def anomaly_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from collections import Counter
    from datetime import datetime

    results = db.query(AnomalyResult).all()
    if not results:
        return AnomalyReportSummary(
            total_scored=0, anomalies_detected=0, benign_count=0,
            attack_type_breakdown={}, risk_level_breakdown={}, avg_risk_score=0.0,
            generated_at=datetime.utcnow(),
        )

    attack_breakdown = dict(Counter(r.predicted_attack_type for r in results))
    risk_breakdown = dict(Counter(r.risk_level for r in results))
    anomalies = sum(1 for r in results if r.is_anomaly == 1)

    return AnomalyReportSummary(
        total_scored=len(results),
        anomalies_detected=anomalies,
        benign_count=len(results) - anomalies,
        attack_type_breakdown=attack_breakdown,
        risk_level_breakdown=risk_breakdown,
        avg_risk_score=round(sum(r.risk_score for r in results) / len(results), 2),
        generated_at=datetime.utcnow(),
    )


@router.get("/model-runs", response_model=list[DetectionModelRunOut])
def model_runs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DetectionModelRun).order_by(DetectionModelRun.trained_at.desc()).all()
