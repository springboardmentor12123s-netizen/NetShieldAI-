"""Anomaly Detector model wrapper using IsolationForest."""

import os
import joblib
from sklearn.ensemble import IsolationForest
import numpy as np


class AnomalyDetector:
    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.is_trained = False

    def fit(self, X: np.ndarray) -> "AnomalyDetector":
        """Fit IsolationForest model."""
        self.model.fit(X)
        self.is_trained = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict outlier status (1 = normal, -1 = anomaly)."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
        return self.model.predict(X)

    def decision_function(self, X: np.ndarray) -> np.ndarray:
        """Compute the raw anomaly score (lower is more anomalous)."""
        if not self.is_trained:
            raise ValueError("Model is not trained yet.")
        return self.model.decision_function(X)

    def compute_anomaly_intensity(self, X: np.ndarray) -> np.ndarray:
        """Converts raw decision scores to anomaly intensity in [0, 1].
        
        Slightly negative or centered scores represent anomalies. By default, 
        decision_function outputs negative values for anomalies, positive for normals.
        """
        scores = self.decision_function(X)
        # Shift and scale decision score to a positive score (higher is more anomalous)
        # decision_function outputs range roughly from -0.5 to +0.5.
        # We transform to [0, 1] range:
        raw_anomaly = -scores
        intensities = 1 / (1 + np.exp(-10 * raw_anomaly))  # Sigmoid scaling
        return intensities

    def save(self, file_path: str):
        """Save trained wrapper to disk."""
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        joblib.dump(self, file_path)

    @classmethod
    def load(cls, file_path: str) -> "AnomalyDetector":
        """Load trained wrapper from disk."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Model file not found at {file_path}")
        return joblib.load(file_path)
