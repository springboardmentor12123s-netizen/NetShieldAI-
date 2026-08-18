from dotenv import load_dotenv
load_dotenv()

import os
import requests as slack_requests
from datetime import datetime

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
from app.services.scoring import score_records

router = APIRouter(prefix="/api/anomaly", tags=["Anomaly Detection & Intrusion Prediction"])


# ── Slack Notification Helper ──────────────────────────────────────────────────

def send_slack_alert(attack_type: str, src_ip: str, risk_score: float, severity: str):
    """Send a real-time threat alert to Slack when HIGH or CRITICAL risk detected."""
    webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
    if not webhook_url:
        return  # Skip silently if webhook not configured

    # Choose emoji based on severity
    emoji_map = {
        "critical": "🚨",
        "high": "⚠️",
        "medium": "🔔",
        "low": "ℹ️",
    }
    emoji = emoji_map.get(severity.lower(), "⚠️")

    # Color for Slack attachment
    color_map = {
        "critical": "#FF4D5E",
        "high": "#F5892F",
        "medium": "#F5C242",
        "low": "#33E6C8",
    }
    color = color_map.get(severity.lower(), "#F5892F")

    # Build Slack message
    message = {
        "text": f"{emoji} *NetShield AI — {severity.upper()} Alert Detected*",
        "attachments": [
            {
                "color": color,
                "fields": [
                    {
                        "title": "Attack Type",
                        "value": attack_type.replace("_", " ").title(),
                        "short": True,
                    },
                    {
                        "title": "Source IP",
                        "value": src_ip,
                        "short": True,
                    },
                    {
                        "title": "Risk Score",
                        "value": f"{risk_score:.2f} / 100",
                        "short": True,
                    },
                    {
                        "title": "Severity",
                        "value": severity.upper(),
                        "short": True,
                    },
                    {
                        "title": "Time",
                        "value": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "short": False,
                    },
                ],
                "footer": "NetShield AI Threat Monitoring",
            }
        ],
    }

    try:
        slack_requests.post(webhook_url, json=message, timeout=5)
    except Exception as e:
        print(f"[Slack] Failed to send alert: {e}")


# ── Routes ─────────────────────────────────────────────────────────────────────

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

    # Notify Slack that a new model was trained
    webhook_url = os.getenv("SLACK_WEBHOOK_URL", "")
    if webhook_url:
        try:
            slack_requests.post(webhook_url, json={
                "text": (
                    f"✅ *NetShield AI — Model Training Complete*\n"
                    f"• Dataset: `{payload.dataset}`\n"
                    f"• Sample size: `{result['sample_size']}`\n"
                    f"• Accuracy: `{ensemble_metrics['accuracy']}`\n"
                    f"• F1-score: `{ensemble_metrics['f1_score']}`"
                )
            }, timeout=5)
        except Exception:
            pass

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

    saved_results = score_records(db, unprocessed)
    if saved_results is None:
        raise HTTPException(status_code=409, detail="No trained model available. Train a model first.")

    # ── Send Slack alerts for HIGH and CRITICAL results ──────────────────────
    # Build a lookup of traffic records by ID for IP address
    record_map = {str(r.id): r for r in unprocessed}

    for result in saved_results:
        if result.risk_level in ("high", "critical"):
            # Get source IP from the corresponding traffic record
            traffic = record_map.get(str(result.traffic_record_id))
            src_ip = traffic.src_ip if traffic else "Unknown"

            send_slack_alert(
                attack_type=result.predicted_attack_type or "Unknown",
                src_ip=str(src_ip),
                risk_score=float(result.risk_score),
                severity=result.risk_level,
            )

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