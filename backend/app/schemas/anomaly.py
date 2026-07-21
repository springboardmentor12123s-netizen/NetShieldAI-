from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class AnomalyResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    traffic_record_id: str
    isolation_forest_score: float
    ocsvm_score: float
    ensemble_anomaly_score: float
    is_anomaly: int
    predicted_attack_type: str
    attack_confidence: float
    risk_score: float
    risk_level: str
    model_version: str
    created_at: datetime


class DetectionModelRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    model_name: str
    dataset_used: str
    trained_at: datetime
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    metrics_json: Optional[Any] = None


class TrainRequest(BaseModel):
    dataset: str = "synthetic"   # "synthetic" | "cicids2017" | "unsw-nb15"
    sample_size: int = 4000


class ScoreRequest(BaseModel):
    """Score all unprocessed traffic records currently in the DB."""
    limit: int = 500


class AnomalyReportSummary(BaseModel):
    total_scored: int
    anomalies_detected: int
    benign_count: int
    attack_type_breakdown: dict
    risk_level_breakdown: dict
    avg_risk_score: float
    generated_at: datetime
