"""
Anomaly Detection & Intrusion Prediction Module (Milestone 2)

AnomalyResult   - per-flow output of the ML pipeline (unsupervised ensemble
                  anomaly score + supervised attack classification + risk score)
DetectionModelRun - metadata about a completed model training run
                    (used for the "Evaluate model performance" outcome)
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    traffic_record_id = Column(String, ForeignKey("traffic_records.id"), nullable=False)

    # Unsupervised ensemble (Isolation Forest + One-Class SVM)
    isolation_forest_score = Column(Float, default=0.0)   # higher = more anomalous
    ocsvm_score = Column(Float, default=0.0)
    ensemble_anomaly_score = Column(Float, default=0.0)   # 0-1 normalized
    is_anomaly = Column(Integer, default=0)                # 0/1 flag

    # Supervised classification (Random Forest)
    predicted_attack_type = Column(String, default="benign")
    attack_confidence = Column(Float, default=0.0)

    # Composite risk scoring engine output
    risk_score = Column(Float, default=0.0)                # 0-100
    risk_level = Column(String, default="low")              # low/medium/high/critical

    model_version = Column(String, default="v1")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    traffic_record = relationship("TrafficRecord")


class DetectionModelRun(Base):
    """Tracks each training run so accuracy/precision/recall/F1 can be reported."""
    __tablename__ = "detection_model_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, nullable=False)     # "isolation_forest", "ocsvm", "random_forest", "ensemble"
    dataset_used = Column(String, nullable=False)    # "cicids2017", "unsw-nb15", "synthetic"
    trained_at = Column(DateTime, default=datetime.utcnow)

    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)

    metrics_json = Column(JSON, nullable=True)       # confusion matrix, per-class metrics, etc.
    artifact_path = Column(String, nullable=True)     # saved .joblib path
