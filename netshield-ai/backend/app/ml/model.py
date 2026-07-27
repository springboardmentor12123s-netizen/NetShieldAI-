"""Loads the trained model once and exposes a predict_traffic() helper."""
import uuid
from datetime import datetime
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

from app.config import settings

NUMERIC_FEATURES = [
    "duration", "src_bytes", "dst_bytes", "packet_count",
    "flow_rate", "wrong_fragment", "urgent", "count", "srv_count",
]
CATEGORICAL_FEATURES = ["protocol_type"]

RECOMMENDED_ACTIONS = {
    "ddos": ["Block source IP", "Enable rate limiting", "Notify administrator"],
    "portscan": ["Block source IP", "Review firewall rules", "Notify administrator"],
    "bruteforce": ["Lock affected account", "Block source IP", "Force password reset"],
    "botnet": ["Isolate host", "Block source IP", "Notify administrator"],
    "normal": ["No action required"],
}

THREAT_LEVELS = [
    (90, "Critical"),
    (70, "High"),
    (40, "Medium"),
    (0, "Low"),
]


def threat_level_for(risk_score: float) -> str:
    for threshold, label in THREAT_LEVELS:
        if risk_score >= threshold:
            return label
    return "Low"


@lru_cache
def get_model():
    path = Path(settings.model_path)
    if not path.exists():
        raise FileNotFoundError(
            f"No trained model found at {path}. Run: python -m app.ml.train_model"
        )
    return joblib.load(path)


def reload_model() -> None:
    """Feature 5 — call this right after a new model file is written to
    settings.model_path so the next prediction picks it up immediately,
    with no server restart required."""
    get_model.cache_clear()


def predict_traffic(payload: dict) -> dict:
    """payload keys match PredictionRequest fields."""
    model = get_model()
    row = {**payload}
    X = pd.DataFrame([{k: row[k] for k in NUMERIC_FEATURES + CATEGORICAL_FEATURES}])

    pred_label = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    classes = list(model.classes_)
    confidence = float(max(proba) * 100)
    risk_score = confidence if pred_label != "normal" else float(
        (1 - proba[classes.index("normal")]) * 100
    )

    return {
        "prediction_id": f"PRED-{uuid.uuid4().hex[:10].upper()}",
        "is_attack": pred_label != "normal",
        "attack_type": pred_label,
        "confidence": round(confidence, 2),
        "risk_score": round(risk_score, 2),
        "threat_level": threat_level_for(risk_score),
        "recommended_actions": RECOMMENDED_ACTIONS.get(pred_label, ["Investigate and block source IP"]),
        "timestamp": datetime.utcnow(),
    }
