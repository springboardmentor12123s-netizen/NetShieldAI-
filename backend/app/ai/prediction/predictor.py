"""Predictor class to run real-time inference using saved model assets."""

import os
import joblib
from typing import Dict, Any, List


class ThreatPredictor:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ThreatPredictor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.save_dir = os.path.join(self.base_dir, "models", "saved")

        self.preprocessor_path = os.path.join(self.save_dir, "preprocessor.joblib")
        self.detector_path = os.path.join(self.save_dir, "anomaly_detector.joblib")
        self.classifier_path = os.path.join(self.save_dir, "threat_classifier.joblib")

        self.preprocessor = None
        self.detector = None
        self.classifier = None
        self.is_loaded = False

        self.load_models()
        self._initialized = True

    def load_models(self) -> bool:
        """Attempt to load saved model assets from joblib files."""
        if (os.path.exists(self.preprocessor_path) and
            os.path.exists(self.detector_path) and
            os.path.exists(self.classifier_path)):
            try:
                # Load preprocessor
                self.preprocessor = joblib.load(self.preprocessor_path)

                # Load custom wrappers
                from app.ai.models.anomaly_detector import AnomalyDetector
                from app.ai.models.threat_classifier import ThreatClassifier

                self.detector = AnomalyDetector.load(self.detector_path)
                self.classifier = ThreatClassifier.load(self.classifier_path)

                self.is_loaded = True
                print("ML models loaded successfully for active threat inference.")
                return True
            except Exception as e:
                print(f"Error loading saved ML models: {e}")
                self.is_loaded = False
        else:
            print("Warning: Model files do not exist yet. Real-time predictions will use fallbacks.")
            self.is_loaded = False
        return False

    def predict_log(self, log_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Runs preprocessor, IsolationForest, and RandomForest inference on a single packet.

        The preprocessor maps the incoming packet dict to the CIC-IDS-2017
        feature space and applies the fitted scaler before prediction.
        """
        if not self.is_loaded:
            # Check if models were since trained and can be loaded now
            if not self.load_models():
                # Default benign fallback
                return {
                    "is_anomaly": False,
                    "anomaly_score": 0.0,
                    "predicted_label": "Normal",
                    "risk_score": 0.0
                }

        try:
            import numpy as np
            # Transform to standard model shape array [1, n_features]
            # The preprocessor.transform() handles dict → CIC-IDS feature mapping
            X = self.preprocessor.transform([log_dict])

            # 1. IsolationForest Anomaly detection (runs decision_function once)
            scores = self.detector.decision_function(X)
            is_anomaly = True if scores[0] < 0 else False
            
            raw_anomaly = -scores[0]
            anomaly_score = float(1.0 / (1.0 + np.exp(-10.0 * raw_anomaly)))

            # 2. RandomForest Classifier (runs predict_proba once)
            proba = self.classifier.predict_proba(X)
            classes = list(self.classifier.model.classes_)
            
            max_proba_idx = np.argmax(proba, axis=1)[0]
            class_idx = classes[max_proba_idx]
            predicted_label = self.classifier.get_label_name(class_idx)

            # Continuous risk score [0..1]
            if 0 in classes:
                normal_idx = classes.index(0)
                risk_score = float(1.0 - proba[0, normal_idx])
            else:
                risk_score = 1.0

            return {
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "predicted_label": predicted_label,
                "risk_score": risk_score
            }

        except Exception as e:
            print(f"Error in model prediction: {e}")
            return {
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "predicted_label": f"Normal (Error Fallback: {e})",
                "risk_score": 0.0
            }

    def predict_batch(self, logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Runs preprocessor, IsolationForest, and RandomForest inference on a batch of packets.

        Leverages numpy scaling and scikit-learn batch predictions to avoid loop overhead.
        """
        if not logs:
            return []

        if not self.is_loaded:
            # Check if models were since trained and can be loaded now
            if not self.load_models():
                # Default benign fallback
                return [{
                    "is_anomaly": False,
                    "anomaly_score": 0.0,
                    "predicted_label": "Normal",
                    "risk_score": 0.0
                } for _ in logs]

        try:
            import numpy as np
            # Batch transformation list[dict] -> Scaled feature matrix [N, n_features]
            X = self.preprocessor.transform(logs)

            # 1. IsolationForest Anomaly detection (runs decision_function once)
            scores = self.detector.decision_function(X)
            outlier_preds = np.ones(scores.shape[0], dtype=int)
            outlier_preds[scores < 0] = -1
            
            raw_anomalies = -scores
            anomaly_scores = 1.0 / (1.0 + np.exp(-10.0 * raw_anomalies))

            # 2. RandomForest Classifier (runs predict_proba once)
            proba = self.classifier.predict_proba(X)
            classes = list(self.classifier.model.classes_)
            
            max_proba_idxs = np.argmax(proba, axis=1)
            class_idxs = [classes[idx] for idx in max_proba_idxs]

            if 0 in classes:
                normal_idx = classes.index(0)
                risk_scores = 1.0 - proba[:, normal_idx]
            else:
                risk_scores = np.ones(X.shape[0])

            results = []
            for i in range(len(logs)):
                is_anomaly = True if outlier_preds[i] == -1 else False
                predicted_label = self.classifier.get_label_name(class_idxs[i])
                results.append({
                    "is_anomaly": is_anomaly,
                    "anomaly_score": float(anomaly_scores[i]),
                    "predicted_label": predicted_label,
                    "risk_score": float(risk_scores[i])
                })
            return results
        except Exception as e:
            print(f"Error in batch model prediction: {e}")
            return [{
                "is_anomaly": False,
                "anomaly_score": 0.0,
                "predicted_label": f"Normal (Error Fallback: {e})",
                "risk_score": 0.0
            } for _ in logs]
