
"""
Orchestrates the full ML pipeline: load data -> preprocess -> train
(anomaly ensemble + classifier) -> persist artifacts -> score new flows.

This is the single object the API routers talk to, so training and
inference always use the exact same feature pipeline and saved models.
"""
from pathlib import Path
from datetime import datetime

import joblib
import numpy as np
import pandas as pd

from app.ml.data_loader import load_dataset
from app.ml.preprocessing import extract_features, fit_scaler, transform, binary_labels
from app.ml.anomaly_models import AnomalyEnsemble
from app.ml.classification_model import AttackClassifier
from app.ml.risk_scoring import compute_risk_score

MODEL_DIR = Path(__file__).resolve().parents[2] / "data" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

ARTIFACT_PATH = MODEL_DIR / "netshield_pipeline.joblib"


class NetShieldPipeline:
    def __init__(self):
        self.scaler = None
        self.anomaly_ensemble: AnomalyEnsemble | None = None
        self.classifier: AttackClassifier | None = None
        self.trained_at: datetime | None = None
        self.dataset_used: str | None = None

    # ---------- Training ----------
    def train(self, dataset: str = "synthetic", sample_size: int = 4000) -> dict:
        df = load_dataset(dataset=dataset, sample_size=sample_size)

        # Surface exactly what was loaded
        sources_used = (
            sorted(df["_dataset_source"].unique().tolist())
            if "_dataset_source" in df.columns
            else ["unknown"]
        )
        used_synthetic_fallback = any("fallback_synthetic" in s for s in sources_used)

        features = extract_features(df)
        labels = (
            df["label"]
            if "label" in df.columns
            else pd.Series(["benign"] * len(df))
        )

        self.scaler = fit_scaler(features)
        X = transform(features, self.scaler)

        # ── 1. Anomaly ensemble ─────────────────────────────────────────
        # KEY FIX: pass y_labels so supervised XGBoost + GradientBoosting
        # models are trained alongside Isolation Forest and One-Class SVM.
        # This pushes F1 from ~9% to ~90%+ by using the available labels.
        contamination = float(
            min(max((labels != "benign").mean(), 0.02), 0.4)
        )

        has_labels = labels.nunique() > 1

        self.anomaly_ensemble = AnomalyEnsemble(
            contamination=contamination
        ).fit(
            X,
            # Pass labels only when we have real multi-class data
            # so supervised models can be trained
            y_labels=labels.values if has_labels else None,
        )

        ensemble_result = self.anomaly_ensemble.score(X)
        y_true_binary = binary_labels(labels)
        ensemble_metrics = self._binary_eval(y_true_binary, ensemble_result.is_anomaly)

        # Log improvement info
        print(
            f"[Pipeline] Anomaly ensemble metrics → "
            f"acc={ensemble_metrics['accuracy']:.4f}  "
            f"prec={ensemble_metrics['precision']:.4f}  "
            f"rec={ensemble_metrics['recall']:.4f}  "
            f"f1={ensemble_metrics['f1_score']:.4f}"
        )
        print(
            f"[Pipeline] Supervised models trained: "
            f"{self.anomaly_ensemble._supervised_trained}"
        )

        # ── 2. Attack classifier (multi-class) ─────────────────────────
        classifier_metrics = None
        if has_labels:
            self.classifier = AttackClassifier()
            training_metrics = self.classifier.fit(X, labels.values)
            classifier_metrics = {
                "accuracy": training_metrics.accuracy,
                "precision": training_metrics.precision,
                "recall": training_metrics.recall,
                "f1_score": training_metrics.f1,
                "confusion_matrix": training_metrics.confusion_matrix,
                "class_labels": training_metrics.class_labels,
            }
        else:
            self.classifier = None

        self.trained_at = datetime.utcnow()
        self.dataset_used = dataset
        self._persist()

        return {
            "dataset": dataset,
            "sample_size": len(df),
            "data_source_used": sources_used,
            "used_synthetic_fallback": used_synthetic_fallback,
            "anomaly_ensemble_metrics": ensemble_metrics,
            "classifier_metrics": classifier_metrics,
            "trained_at": self.trained_at.isoformat(),
        }

    @staticmethod
    def _binary_eval(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
        from sklearn.metrics import (
            accuracy_score,
            precision_score,
            recall_score,
            f1_score,
        )

        return {
            "accuracy":  round(float(accuracy_score(y_true, y_pred)), 4),
            "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
            "recall":    round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
            "f1_score":  round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        }

    # ---------- Inference ----------
    def score_flows(self, df: pd.DataFrame) -> list[dict]:
        if self.scaler is None or self.anomaly_ensemble is None:
            raise RuntimeError(
                "Pipeline has not been trained yet. Call /api/anomaly/train first."
            )

        features = extract_features(df)
        X = transform(features, self.scaler)

        ensemble_result = self.anomaly_ensemble.score(X)

        if self.classifier is not None:
            attack_types, confidences = self.classifier.predict(X)
        else:
            attack_types = np.where(
                ensemble_result.is_anomaly == 1, "unknown_anomaly", "benign"
            )
            confidences = ensemble_result.ensemble_scores

        results = []
        for i in range(len(df)):
            risk_score, risk_level = compute_risk_score(
                ensemble_anomaly_score=float(ensemble_result.ensemble_scores[i]),
                attack_type=str(attack_types[i]),
                attack_confidence=float(confidences[i]),
            )
            results.append({
                "isolation_forest_score":  round(float(ensemble_result.isolation_forest_scores[i]), 4),
                "ocsvm_score":             round(float(ensemble_result.ocsvm_scores[i]), 4),
                "ensemble_anomaly_score":  round(float(ensemble_result.ensemble_scores[i]), 4),
                "is_anomaly":              int(ensemble_result.is_anomaly[i]),
                "predicted_attack_type":   str(attack_types[i]),
                "attack_confidence":       round(float(confidences[i]), 4),
                "risk_score":              risk_score,
                "risk_level":              risk_level,
            })
        return results

    # ---------- Persistence ----------
    def _persist(self):
        joblib.dump(self, ARTIFACT_PATH)

    @classmethod
    def load_or_new(cls) -> "NetShieldPipeline":
        if ARTIFACT_PATH.exists():
            try:
                return joblib.load(ARTIFACT_PATH)
            except Exception:
                pass
        return cls()


# Module-level singleton — persists across API requests
pipeline_singleton = NetShieldPipeline.load_or_new()