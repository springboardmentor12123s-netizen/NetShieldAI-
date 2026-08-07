"""
NetShield AI — Isolation Forest training and prediction service.

Handles feature extraction, model training with cross-validation,
and enriched inference (predictions + supervised metrics when labels
are present).
"""

from app.services.threat_classifier import classify_threats
from app.services.risk_service import compute_risk
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.ensemble import IsolationForest
from fastapi import HTTPException
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import logging
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — safe for headless servers.


logger = logging.getLogger("netshield.ml")

# Column names (case-insensitive) that are treated as ground-truth labels.
LABEL_NAMES = {"label", "class", "target", "attack", "category"}

# Directory where the confusion matrix image is persisted.
_ML_CORE_DIR = Path(__file__).resolve().parents[3] / "ml_core"
_CONFUSION_MATRIX_PATH = _ML_CORE_DIR / "confusion_matrix.png"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _numeric_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Extract and clean numeric columns suitable for the model."""
    numeric = frame.select_dtypes(include=[np.number]).replace([np.inf, -np.inf], np.nan)
    numeric = numeric.dropna(axis=1, how="all")
    if numeric.empty:
        raise HTTPException(status_code=400, detail="CSV does not contain usable numeric columns.")
    return numeric.fillna(numeric.median()).fillna(0)


def _find_label(frame: pd.DataFrame) -> pd.Series | None:
    """
    Locate a ground-truth label column and encode it as binary (0=normal, 1=attack).

    Returns None if no recognised label column exists.
    """
    for column in frame.columns:
        if str(column).strip().lower() in LABEL_NAMES:
            values = frame[column].astype(str).str.strip().str.lower()
            return (~values.isin({"benign", "normal", "0", "false"})).astype(int)
    return None


def _statistical_labels(features: pd.DataFrame) -> np.ndarray:
    """
    Generate pseudo-labels via robust Z-score (MAD-based) when no Label column exists.

    Rows with a max robust Z-score > 3.5 across any feature are flagged as anomalous.
    """
    median = features.median()
    mad = (features - median).abs().median().replace(0, 1)
    robust_z = 0.6745 * (features - median).abs() / mad
    return (robust_z.max(axis=1) > 3.5).astype(int).to_numpy()


def _compute_roc_auc(actual: np.ndarray, predicted: np.ndarray) -> float | None:
    """Compute ROC-AUC safely; returns None when only one class is present."""
    try:
        unique_classes = np.unique(actual)
        if len(unique_classes) < 2:
            return None
        return round(float(roc_auc_score(actual, predicted) * 100), 2)
    except (ValueError, IndexError):
        return None


def _print_performance_report(
    *,
    total_rows: int,
    train_rows: int,
    test_rows: int,
    accuracy: float,
    precision: float,
    recall: float,
    f1: float,
    roc_auc: float | None,
    cm: list[list[int]],
    cls_report: str,
    evaluation: str,
    phase: str = "TRAINING",
) -> None:
    """Print a clean, professional model-performance block to the terminal."""
    roc_display = f"{roc_auc:.2f}%" if roc_auc is not None else "N/A (single class)"
    separator = "=" * 56

    report_text = f"""
{separator}
  MODEL PERFORMANCE — {phase}
{separator}

  Evaluation     : {evaluation}
  Dataset Size   : {total_rows:>10,} rows
  Training Rows  : {train_rows:>10,}
  Testing Rows   : {test_rows:>10,}

  Accuracy       : {accuracy:>8.2f}%
  Precision      : {precision:>8.2f}%
  Recall         : {recall:>8.2f}%
  F1 Score       : {f1:>8.2f}%
  ROC-AUC        : {roc_display:>8}

  Confusion Matrix

  {np.array(cm)}

  Classification Report

{cls_report}
{separator}
"""
    logger.info(report_text)


def _save_confusion_matrix_image(
    cm: list[list[int]],
    labels: list[str] | None = None,
    save_path: Path | None = None,
) -> Path:
    """
    Generate a labelled confusion-matrix heatmap and save it as a PNG.

    Returns the path to the saved image.
    """
    if labels is None:
        labels = ["Normal (0)", "Anomaly (1)"]
    if save_path is None:
        save_path = _CONFUSION_MATRIX_PATH

    save_path.parent.mkdir(parents=True, exist_ok=True)
    cm_array = np.array(cm)

    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.imshow(cm_array, interpolation="nearest", cmap="Blues")
    fig.colorbar(cax, ax=ax, fraction=0.046, pad=0.04)

    ax.set_title("Confusion Matrix — NetShield AI", fontsize=14, fontweight="bold", pad=12)
    ax.set_xlabel("Predicted Label", fontsize=12)
    ax.set_ylabel("True Label", fontsize=12)

    tick_positions = list(range(len(labels)))
    ax.set_xticks(tick_positions)
    ax.set_yticks(tick_positions)
    ax.set_xticklabels(labels, fontsize=10)
    ax.set_yticklabels(labels, fontsize=10)

    # Annotate each cell with its value.
    thresh = cm_array.max() / 2.0
    for i in range(cm_array.shape[0]):
        for j in range(cm_array.shape[1]):
            ax.text(
                j, i, f"{cm_array[i, j]:,}",
                ha="center", va="center", fontsize=13, fontweight="bold",
                color="white" if cm_array[i, j] > thresh else "black",
            )

    fig.tight_layout()
    fig.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    logger.info("Confusion matrix saved to %s", save_path)
    return save_path


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def train_model(frame: pd.DataFrame, model_path: Path) -> dict:
    """
    Train an Isolation Forest pipeline on *frame* and persist it to *model_path*.

    Uses a 75/25 train-test split.  Evaluation is done against dataset labels
    when present, otherwise against a statistical (MAD) baseline.

    Returns a metrics dict with accuracy, precision, recall, f1_score, roc_auc,
    confusion_matrix, classification_report, feature_count, and evaluation keys.
    """
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
    actual = (
        labels.iloc[test_idx].to_numpy()
        if labels is not None
        else _statistical_labels(features.iloc[test_idx])
    )

    tn, fp, fn, tp = confusion_matrix(actual, predicted, labels=[0, 1]).ravel()
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "features": list(features.columns)}, model_path)

    acc = round(float(accuracy_score(actual, predicted) * 100), 2)
    prec = round(float(precision_score(actual, predicted, zero_division=0) * 100), 2)
    rec = round(float(recall_score(actual, predicted, zero_division=0) * 100), 2)
    f1 = round(float(f1_score(actual, predicted, zero_division=0) * 100), 2)
    roc_auc = _compute_roc_auc(actual, predicted)
    cls_report = classification_report(actual, predicted, target_names=["Normal", "Anomaly"], zero_division=0)
    cm = [[int(tn), int(fp)], [int(fn), int(tp)]]

    eval_label = "dataset labels" if labels is not None else "statistical baseline"

    # --- Terminal output (Part 1) -----------------------------------------
    _print_performance_report(
        total_rows=len(features),
        train_rows=len(train_idx),
        test_rows=len(test_idx),
        accuracy=acc,
        precision=prec,
        recall=rec,
        f1=f1,
        roc_auc=roc_auc,
        cm=cm,
        cls_report=cls_report,
        evaluation=eval_label,
        phase="TRAINING",
    )

    # --- Confusion matrix image (Part 2) ----------------------------------
    _save_confusion_matrix_image(cm)

    metrics = {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": cm,
        "classification_report": cls_report,
        "feature_count": len(features.columns),
        "evaluation": eval_label,
    }
    return metrics


def predict(frame: pd.DataFrame, model_path: Path) -> tuple[pd.DataFrame, dict | None]:
    """
    Run the Isolation Forest on *frame* and return an enriched DataFrame.

    Returns
    -------
    (output, supervised_metrics)
        *output* : DataFrame with Prediction, Prediction Label, Threat Category,
                   Risk Score, and Severity columns added.
        *supervised_metrics* : dict with accuracy/precision/recall/f1_score/roc_auc
                               if the CSV contained a Label column; otherwise None.
    """
    if not model_path.exists():
        raise HTTPException(status_code=400, detail="No trained model found. Train a model first.")

    bundle = joblib.load(model_path)
    required = bundle["features"]
    numeric = _numeric_features(frame)
    missing = [column for column in required if column not in numeric.columns]
    if missing:
        preview = ", ".join(map(str, missing[:5]))
        raise HTTPException(
            status_code=400,
            detail=f"Prediction CSV is missing required features: {preview}",
        )

    values = numeric[required].replace([np.inf, -np.inf], np.nan).fillna(0)
    output = frame.copy()
    raw_preds = bundle["pipeline"].predict(values)
    output["Prediction"] = np.where(raw_preds == -1, "Anomaly", "Normal")

    # Supervised evaluation — only when the CSV has a Label column.
    supervised_metrics: dict | None = None
    true_labels = _find_label(frame)
    if true_labels is not None:
        predicted_binary = (raw_preds == -1).astype(int)
        tn, fp, fn, tp = confusion_matrix(
            true_labels.to_numpy(), predicted_binary, labels=[0, 1]
        ).ravel()
        acc = round(float(accuracy_score(true_labels, predicted_binary) * 100), 2)
        prec = round(float(precision_score(true_labels, predicted_binary, zero_division=0) * 100), 2)
        rec = round(float(recall_score(true_labels, predicted_binary, zero_division=0) * 100), 2)
        f1 = round(float(f1_score(true_labels, predicted_binary, zero_division=0) * 100), 2)
        roc_auc = _compute_roc_auc(true_labels.to_numpy(), predicted_binary)
        cls_report = classification_report(
            true_labels, predicted_binary, target_names=["Normal", "Anomaly"], zero_division=0,
        )
        cm = [[int(tn), int(fp)], [int(fn), int(tp)]]

        supervised_metrics = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": roc_auc,
            "confusion_matrix": cm,
            "classification_report": cls_report,
            "note": "Evaluated against dataset Label column.",
        }

        # --- Terminal output (Part 1) -------------------------------------
        _print_performance_report(
            total_rows=len(frame),
            train_rows=0,
            test_rows=len(frame),
            accuracy=acc,
            precision=prec,
            recall=rec,
            f1=f1,
            roc_auc=roc_auc,
            cm=cm,
            cls_report=cls_report,
            evaluation="dataset labels (prediction CSV)",
            phase="PREDICTION",
        )

        # --- Confusion matrix image (Part 2) ------------------------------
        _save_confusion_matrix_image(cm)

    # Rule-based threat classification.
    output["Threat Category"] = classify_threats(output)

    # Risk scoring and severity assignment.
    output = compute_risk(output)

    return output, supervised_metrics
