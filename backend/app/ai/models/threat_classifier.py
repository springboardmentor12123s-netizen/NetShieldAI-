"""Threat Classifier model wrapper using RandomForestClassifier."""

import os
import joblib
from sklearn.ensemble import RandomForestClassifier
import numpy as np
from typing import List, Dict, Any


class ThreatClassifier:
    def __init__(self, n_estimators: int = 200, random_state: int = 42):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=random_state,
            n_jobs=-1,
            max_depth=30,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
        )
        self.is_trained = False

        # Label to category description mapping (CIC-IDS-2017 consolidated)
        self.classes_map = {
            0: "Normal",
            1: "PortScan",
            2: "DDoS",
            3: "DoS",
            4: "Brute Force",
            5: "Web Attack",
            6: "Bot",
            7: "Other Threat",
        }

    def fit(self, X: np.ndarray, y: np.ndarray) -> "ThreatClassifier":
        """Fit RandomForest model."""
        self.model.fit(X, y)
        self.is_trained = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict concrete class index (0..7)."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class probability distribution."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
        return self.model.predict_proba(X)

    def get_risk_score(self, X: np.ndarray) -> np.ndarray:
        """Computes Risk Score as probability of being non-normal.

        Risk Score = 1.0 - probability_normal.
        Provides a continuous threat indicator in [0, 1].
        """
        proba = self.predict_proba(X)
        # Class 0 is normal. Risk score = 1.0 - P(normal)
        # Find the column index for class 0 in the trained model
        classes = list(self.model.classes_)
        if 0 in classes:
            normal_idx = classes.index(0)
            return 1.0 - proba[:, normal_idx]
        # If normal class wasn't seen in training, everything is risky
        return np.ones(X.shape[0])

    def get_label_name(self, class_idx: int) -> str:
        """Returns string representation of threat category."""
        return self.classes_map.get(int(class_idx), "Unknown Threat")

    def save(self, file_path: str):
        """Save trained wrapper to disk."""
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        joblib.dump(self, file_path)

    @classmethod
    def load(cls, file_path: str) -> "ThreatClassifier":
        """Load trained wrapper from disk."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Model file not found at {file_path}")
        return joblib.load(file_path)
