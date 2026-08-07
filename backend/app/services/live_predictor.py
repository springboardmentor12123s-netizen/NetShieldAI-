import logging
import threading
import queue
import datetime
from pathlib import Path
from typing import Dict, List, Any

import joblib
import pandas as pd
import numpy as np

from app.services.risk_service import compute_risk
from app.services.threat_classifier import classify_threats
from app.services.ml_service import train_model

logger = logging.getLogger("netshield.live_predictor")


class LivePredictor:
    def __init__(self, max_history=1000):
        self.max_history = max_history
        self.predictions: List[Dict[str, Any]] = []
        self.lock = threading.Lock()

        self.model = None
        self.features_order = None
        self.model_load_attempted = False

        # Async inference queue
        self.prediction_queue = queue.Queue()
        self.is_running = True
        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()

        # Load or train model at startup
        self._load_model()

    def _load_model(self):
        if self.model_load_attempted:
            return self.model is not None

        self.model_load_attempted = True
        model_path = Path(__file__).resolve().parents[3] / "saved_models" / "model.joblib"
        logger.info(f"Startup: Model file path is {model_path}")

        try:
            if not model_path.exists():
                logger.info("Startup: Model file is missing. Training a new model from sample data...")
                sample_data_path = Path(__file__).resolve().parents[3] / "sample_data" / "training_sample.csv"
                if sample_data_path.exists():
                    df = pd.read_csv(sample_data_path)
                    train_model(df, model_path)
                else:
                    logger.warning(f"Startup: Cannot train model. Sample data {sample_data_path} not found.")
                    return False

            if model_path.exists():
                bundle = joblib.load(model_path)
                self.model = bundle["pipeline"]
                self.features_order = bundle["features"]
                logger.info("Successfully loaded ML model for live predictions.")
                return True
        except Exception as e:
            logger.exception(f"Failed to load ML model: {e}")
        return False

    def enqueue_prediction(self, vector: Dict[str, Any]):
        """Non-blocking queueing of feature vectors for prediction."""
        self.prediction_queue.put(vector)

    def _worker_loop(self):
        logger.info("LivePredictor worker thread started.")
        while self.is_running:
            try:
                vector = self.prediction_queue.get(timeout=1.0)
                try:
                    self._predict_sync(vector)
                except Exception as e:
                    logger.exception(f"Live prediction processing error for {vector.get('flow_id')}: {e}")
                finally:
                    self.prediction_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.exception(f"Unexpected error in live predictor queue loop: {e}")

    def stop(self):
        self.is_running = False
        if self.worker_thread.is_alive():
            self.worker_thread.join(timeout=2.0)

    def _predict_sync(self, vector: Dict[str, Any]):
        if self.model is None and not self._load_model():
            return  # Model not available

        try:
            features = vector["features"]
            # Convert to DataFrame to leverage existing utilities
            df = pd.DataFrame([features])

            # Remove non-feature columns if they somehow got in
            non_features = ["Prediction", "Label", "flow_id", "timestamp", "confidence",
                            "Prediction Label", "Threat Category", "Severity", "Risk Score"]
            for col in non_features:
                if col in df.columns:
                    df = df.drop(columns=[col])

            # Ensure ordering and handle missing cols gracefully
            for col in self.features_order:
                if col not in df.columns:
                    df[col] = 0.0

            df = df[self.features_order]

            logger.debug(f"\nTraining features:\n{self.features_order}")
            logger.debug(f"Prediction features:\n{df.columns.tolist()}")
            if hasattr(self.model, "feature_names_in_"):
                logger.debug(f"Model feature_names_in_:\n{list(self.model.feature_names_in_)}")
            logger.debug(f"Final inference columns:\n{df.columns.tolist()}\n")

            # Prediction
            raw_pred = self.model.predict(df)

            # Calculate a pseudo-confidence using decision function (distance from hyperplane)
            decision_score = self.model.decision_function(df)[0]

            # Create prediction explicitly without reading from df
            prediction = "Anomaly" if raw_pred[0] == -1 else "Normal"
            df["Prediction"] = prediction

            # Normalize decision score to an approximate 0-1 confidence
            # IsolationForest decision score is negative for anomalies, positive for normal
            # Sigmoid approximation: 1 / (1 + exp(-x))
            confidence = round(float(1 / (1 + np.exp(-decision_score * 5))), 4)

            # Enrich using existing ML modules
            df["Threat Category"] = classify_threats(df)
            df = compute_risk(df)

            timestamp_iso = datetime.datetime.now().isoformat()

            # 0=Normal, 1=Anomaly
            # Our prompt wants "BENIGN or attack class such as DDoS"
            predicted_class = "BENIGN" if raw_pred[0] == 1 else df.iloc[0]["Threat Category"]

            result = {
                "flow_id": vector["flow_id"],
                "prediction_timestamp": timestamp_iso,
                "predicted_class": predicted_class,
                "confidence": confidence,
                "risk_score": int(df.iloc[0]["Risk Score"]),
                "severity": df.iloc[0]["Severity"],
                "prediction_label": df.iloc[0]["Prediction Label"],
                "features": features
            }

            with self.lock:
                self.predictions.append(result)
                if len(self.predictions) > self.max_history:
                    self.predictions.pop(0)

            if predicted_class != "BENIGN":
                try:
                    from app.services.incident_service import incident_service
                    incident_service.create_incident_from_prediction(result)
                except Exception as ex:
                    logger.error(f"Failed to trigger incident creation: {ex}")

            logger.info(f"Predictions generated: {vector['flow_id']} -> {predicted_class} (Confidence: {confidence})")

        except Exception as e:
            logger.error(f"Failed to run inference on flow {vector.get('flow_id')}: {e}")

    def get_latest_predictions(self):
        with self.lock:
            return list(self.predictions)


live_predictor = LivePredictor()
