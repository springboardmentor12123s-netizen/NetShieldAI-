from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException
from sklearn.ensemble import IsolationForest
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.services.risk_service import compute_risk
from app.services.threat_classifier import classify_threats

LABEL_NAMES = {"label", "class", "target", "attack", "category"}


def _numeric_features(frame: pd.DataFrame) -> pd.DataFrame:
    numeric = frame.select_dtypes(include=[np.number]).replace([np.inf, -np.inf], np.nan)
    numeric = numeric.dropna(axis=1, how="all")
    if numeric.empty:
        raise HTTPException(status_code=400, detail="CSV does not contain usable numeric columns.")
    return numeric.fillna(numeric.median()).fillna(0)


def _find_label(frame: pd.DataFrame) -> pd.Series | None:
    for column in frame.columns:
        if str(column).strip().lower() in LABEL_NAMES:
            values = frame[column].astype(str).str.strip().str.lower()
            return (~values.isin({"benign", "normal", "0", "false"})).astype(int)
    return None


def _statistical_labels(features: pd.DataFrame) -> np.ndarray:
    median = features.median()
    mad = (features - median).abs().median().replace(0, 1)
    robust_z = 0.6745 * (features - median).abs() / mad
    return (robust_z.max(axis=1) > 3.5).astype(int).to_numpy()


def train_model(frame: pd.DataFrame, model_path: Path) -> dict:
    features = _numeric_features(frame)
    if len(features) < 4:
        raise HTTPException(status_code=400, detail="Training requires at least four data rows.")
    labels = _find_label(frame)
    indices = np.arange(len(features))
    train_idx, test_idx = train_test_split(indices, test_size=0.25, random_state=42)

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "model",
                IsolationForest(
                    n_estimators=150,
                    contamination="auto",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(features.iloc[train_idx])
    predicted = (pipeline.predict(features.iloc[test_idx]) == -1).astype(int)
    actual = labels.iloc[test_idx].to_numpy() if labels is not None else _statistical_labels(features.iloc[test_idx])

    tn, fp, fn, tp = confusion_matrix(actual, predicted, labels=[0, 1]).ravel()
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "features": list(features.columns)}, model_path)

    return {
        "accuracy": round(float(accuracy_score(actual, predicted) * 100), 2),
        "precision": round(float(precision_score(actual, predicted, zero_division=0) * 100), 2),
        "recall": round(float(recall_score(actual, predicted, zero_division=0) * 100), 2),
        "f1_score": round(float(f1_score(actual, predicted, zero_division=0) * 100), 2),
        "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
        "feature_count": len(features.columns),
        "evaluation": "dataset labels" if labels is not None else "statistical baseline",
    }


def predict(frame: pd.DataFrame, model_path: Path) -> tuple[pd.DataFrame, dict | None]:
    """
    Run the Isolation Forest on *frame* and return an enriched DataFrame.

    Returns
    -------
    (output, supervised_metrics)
        *output* : DataFrame with Prediction, Prediction Label, Threat Category,
                   Risk Score, Severity columns added.
        *supervised_metrics* : dict with accuracy/precision/recall/f1_score if
                               the CSV contained a Label column; otherwise None.
    """
    if not model_path.exists():
        raise HTTPException(status_code=400, detail="No trained model found. Train a model first.")
    bundle = joblib.load(model_path)
    required = bundle["features"]
    numeric = _numeric_features(frame)
    missing = [column for column in required if column not in numeric.columns]
    if missing:
        preview = ", ".join(map(str, missing[:5]))
        raise HTTPException(status_code=400, detail=f"Prediction CSV is missing required features: {preview}")

    values = numeric[required].replace([np.inf, -np.inf], np.nan).fillna(0)
    output = frame.copy()
    raw_preds = bundle["pipeline"].predict(values)
    output["Prediction"] = np.where(raw_preds == -1, "Anomaly", "Normal")

    # -----------------------------------------------------------------------
    # Supervised evaluation – only when the CSV has a Label column
    # -----------------------------------------------------------------------
    supervised_metrics: dict | None = None
    true_labels = _find_label(frame)
    if true_labels is not None:
        predicted_binary = (raw_preds == -1).astype(int)
        tn, fp, fn, tp = confusion_matrix(
            true_labels.to_numpy(), predicted_binary, labels=[0, 1]
        ).ravel()
        supervised_metrics = {
            "accuracy": round(float(accuracy_score(true_labels, predicted_binary) * 100), 2),
            "precision": round(float(precision_score(true_labels, predicted_binary, zero_division=0) * 100), 2),
            "recall": round(float(recall_score(true_labels, predicted_binary, zero_division=0) * 100), 2),
            "f1_score": round(float(f1_score(true_labels, predicted_binary, zero_division=0) * 100), 2),
            "confusion_matrix": [[int(tn), int(fp)], [int(fn), int(tp)]],
            "note": "Evaluated against dataset Label column.",
        }

    # -----------------------------------------------------------------------
    # Threat classification (rule-based)
    # -----------------------------------------------------------------------
    output["Threat Category"] = classify_threats(output)

    # -----------------------------------------------------------------------
    # Risk scoring
    # -----------------------------------------------------------------------
    output = compute_risk(output)

    return output, supervised_metrics
