"""Threat Classifier model wrapper using RandomForestClassifier."""

import os
import joblib
from sklearn.ensemble import RandomForestClassifier
import numpy as np
from typing import List, Dict, Any



class ThreatClassifier:
    def __init__(self, n_estimators: int = 100, random_state: int = 42):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=random_state,
            n_jobs=-1
        )
        self.is_trained = False
        
        # Label to category description mapping
        self.classes_map = {
            0: "Normal",
            1: "PortScan",
            2: "DDoS",
            3: "Exploits",
            4: "DoS",
            5: "Fuzzers",
            6: "Other Threat"
        }

    def fit(self, X: np.ndarray, y: np.ndarray) -> "ThreatClassifier":
        """Fit RandomForest model."""
        self.model.fit(X, y)
        self.is_trained = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict concrete class index (0..6)."""
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
        This provides a continuous threat indicator in [0, 1].
        """
        proba = self.predict_proba(X)
        # Class 0 is normal. Thus risk score = 1.0 - proba[:, 0]
        # In case some classes were not present in training, we double check size
        if proba.shape[1] > 0:
            return 1.0 - proba[:, 0]
        return np.zeros(X.shape[0])

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
