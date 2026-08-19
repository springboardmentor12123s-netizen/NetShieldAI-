"""
Milestone 2 — trains the AI intrusion-detection model from the dataset
at DATASET_PATH and saves it to MODEL_PATH, plus a full evaluation report
(accuracy, precision, recall, F1, confusion matrix, ROC-AUC, feature
importance) to MODEL_METRICS_PATH so the Dashboard/Settings pages can
display it without re-running training.

Run with:
    python -m app.ml.train_model

If DATASET_PATH doesn't exist yet, run generate_dataset.py first
(see that file for how to plug in your own real dataset instead).
"""
import json
import time
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelBinarizer, OneHotEncoder, StandardScaler

from app.config import settings

# --- If your dataset's column names differ, edit these two lists ---
NUMERIC_FEATURES = [
    "duration", "src_bytes", "dst_bytes", "packet_count",
    "flow_rate", "wrong_fragment", "urgent", "count", "srv_count",
]
CATEGORICAL_FEATURES = ["protocol_type"]
LABEL_COLUMN = "label"


def load_dataset(dataset_path: str | None = None) -> pd.DataFrame:
    path = Path(dataset_path or settings.dataset_path)
    if not path.exists():
        raise FileNotFoundError(
            f"No dataset found at {path}. Either place your dataset there, "
            f"or run: python -m app.ml.generate_dataset"
        )
    return pd.read_csv(path)


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), NUMERIC_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ])
    model = RandomForestClassifier(
        n_estimators=200, max_depth=None, random_state=42, n_jobs=-1
    )
    return Pipeline([("preprocess", preprocessor), ("model", model)])


def _feature_importance(pipeline: Pipeline) -> list[dict]:
    try:
        ohe = pipeline.named_steps["preprocess"].named_transformers_["cat"]
        cat_names = list(ohe.get_feature_names_out(CATEGORICAL_FEATURES))
        all_names = NUMERIC_FEATURES + cat_names
        importances = pipeline.named_steps["model"].feature_importances_
        pairs = sorted(zip(all_names, importances), key=lambda p: p[1], reverse=True)
        return [{"feature": name, "importance": round(float(val), 4)} for name, val in pairs]
    except Exception:
        return []


def _roc_auc(pipeline: Pipeline, X_test, y_test, classes) -> float | None:
    try:
        y_proba = pipeline.predict_proba(X_test)
        if len(classes) == 2:
            return round(float(roc_auc_score(y_test, y_proba[:, 1])), 4)
        lb = LabelBinarizer().fit(classes)
        y_test_bin = lb.transform(y_test)
        return round(float(roc_auc_score(y_test_bin, y_proba, multi_class="ovr", average="macro")), 4)
    except Exception:
        return None


def train(
    dataset_path: str | None = None,
    model_path: str | None = None,
    metrics_path: str | None = None,
    progress_cb=None,
) -> dict:
    """Trains the intrusion-detection pipeline and saves the model + metrics.

    progress_cb, if given, is called as progress_cb(stage: str, message: str)
    at each major step — used by the Training page (Feature 5) to show a
    progress bar and live logs. Returns the metrics dict (also written to
    metrics_path)."""

    def report(stage: str, message: str) -> None:
        print(message)
        if progress_cb:
            progress_cb(stage, message)

    started = time.time()
    report("loading_dataset", "Loading dataset...")
    df = load_dataset(dataset_path)
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[LABEL_COLUMN]
    classes = sorted(y.unique().tolist())

    report("splitting", "Splitting into train/test sets (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    report(
        "training",
        f"Training samples: {len(X_train)} | Testing samples: {len(X_test)}. "
        "Preprocessing + training started...",
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    report("training_complete", "Training completed.")

    report("evaluating", "Evaluating on the held-out test set...")
    y_pred = pipeline.predict(X_test)

    training_time_seconds = round(time.time() - started, 2)
    metrics = {
        "trained_at": datetime.utcnow().isoformat(),
        "training_samples": int(len(X_train)),
        "testing_samples": int(len(X_test)),
        "classes": classes,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "roc_auc": _roc_auc(pipeline, X_test, y_test, classes),
        "confusion_matrix": confusion_matrix(y_test, y_pred, labels=classes).tolist(),
        "confusion_matrix_labels": classes,
        "feature_importance": _feature_importance(pipeline),
        "classification_report": classification_report(y_test, y_pred, output_dict=True, zero_division=0),
        "training_time_seconds": training_time_seconds,
    }

    report("saving", f"Accuracy: {metrics['accuracy']} | F1: {metrics['f1_score']} | saving model...")

    resolved_model_path = Path(model_path or settings.model_path)
    resolved_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, resolved_model_path)

    resolved_metrics_path = Path(metrics_path or settings.model_metrics_path)
    resolved_metrics_path.write_text(json.dumps(metrics, indent=2))

    report("completed", f"Model saved to {resolved_model_path}. Metrics saved to {resolved_metrics_path}.")
    return metrics


if __name__ == "__main__":
    train()
