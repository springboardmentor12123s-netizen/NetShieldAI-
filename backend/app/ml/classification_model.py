
"""
Supervised attack classification (Milestone 2 - "Intrusion Prediction Module").

A Random Forest classifier trained on labeled flows predicts the specific
attack type (or "benign") and returns a class-probability confidence score,
which the risk-scoring engine folds into its composite score.
"""
from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


@dataclass
class TrainingMetrics:
    accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: list
    class_labels: list


class AttackClassifier:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=16,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        self.label_encoder = LabelEncoder()

    def fit(self, X: np.ndarray, labels: np.ndarray) -> TrainingMetrics:
        y = self.label_encoder.fit_transform(labels)

        # Stratified splitting requires every class to have at least 2
        # members (1 for train, 1 for test). Real-world benchmark datasets
        # often have ultra-rare attack categories (e.g. a handful of "worms"
        # samples) that can end up with just 1 example in a given random
        # sample — stratify would crash on that, so fall back to a plain
        # (non-stratified) split whenever any class is that sparse.
        class_counts = np.bincount(y)
        can_stratify = len(set(y)) > 1 and class_counts.min() >= 2

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y if can_stratify else None
        )

        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)

        avg = "weighted" if len(set(y)) > 2 else "binary"
        return TrainingMetrics(
            accuracy=round(float(accuracy_score(y_test, y_pred)), 4),
            precision=round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            recall=round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            f1=round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            confusion_matrix=confusion_matrix(y_test, y_pred).tolist(),
            class_labels=list(self.label_encoder.classes_),
        )

    def predict(self, X: np.ndarray):
        pred_idx = self.model.predict(X)
        proba = self.model.predict_proba(X)
        confidences = proba.max(axis=1)
        labels = self.label_encoder.inverse_transform(pred_idx)
        return labels, confidences