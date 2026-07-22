"""Trainer class to query MongoDB logs, train ML models, and serialize assets."""

import os
import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import numpy as np

from app.core.mongodb import MongoDBManager
from app.repositories.traffic_repository import TrafficRepository
from app.ai.preprocessing.preprocessor import NetworkTrafficPreprocessor
from app.ai.models.anomaly_detector import AnomalyDetector
from app.ai.models.threat_classifier import ThreatClassifier
import joblib


class ModelTrainer:
    def __init__(self, contamination: float = 0.05, n_estimators: int = 100):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.save_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "saved")
        
    async def load_data_from_mongodb(self) -> list:
        """Gathers all logs from MongoDB `traffic_logs` collection."""
        db = MongoDBManager.get_database()
        cursor = db["traffic_logs"].find({})
        logs = await cursor.to_list(length=10000)
        return logs

    async def train_and_evaluate(self) -> dict:
        """Runs the whole training and evaluation pipeline."""
        print("Gathering data from MongoDB...")
        logs = await self.load_data_from_mongodb()
        
        if not logs or len(logs) < 5:
            raise ValueError(f"Insufficient training data. Found only {len(logs)} records in MongoDB. Please seed or load datasets first.")
            
        print(f"Loaded {len(logs)} records for training.")
        
        preprocessor = NetworkTrafficPreprocessor()
        X_raw = preprocessor.fit_transform(logs)
        y_raw = preprocessor.extract_labels(logs)
        
        # Split data for supervised RF
        X_train, X_test, y_train, y_test = train_test_split(
            X_raw, y_raw, test_size=0.3, random_state=42, stratify=y_raw if len(np.unique(y_raw)) > 1 else None
        )
        
        # 1. Fit Anomaly Detector (Isolation Forest)
        print("Fitting IsolationForest Anomaly Detector...")
        detector = AnomalyDetector(contamination=self.contamination)
        detector.fit(X_raw)  # Fits on all traffic (unsupervised)
        
        # Evaluate anomaly detector
        anomaly_preds = detector.predict(X_test)
        num_anomalies = np.sum(anomaly_preds == -1)
        print(f"Anomaly Detector flagged {num_anomalies} anomalies out of {X_test.shape[0]} test samples.")
        
        # 2. Fit Threat Classifier (Random Forest)
        print("Fitting RandomForest Threat Classifier...")
        classifier = ThreatClassifier(n_estimators=self.n_estimators)
        classifier.fit(X_train, y_train)
        
        # Evaluate threat classifier
        y_pred = classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        unique_classes = np.unique(y_test)
        target_names = [classifier.get_label_name(c) for c in unique_classes]
        
        report_str = classification_report(
            y_test, y_pred, labels=unique_classes, target_names=target_names, output_dict=False
        )
        report_dict = classification_report(
            y_test, y_pred, labels=unique_classes, target_names=target_names, output_dict=True
        )
        
        print("\n--- RandomForest Classification Report ---")
        print(report_str)
        print("------------------------------------------")
        
        # Save models and preprocessor
        os.makedirs(self.save_dir, exist_ok=True)
        
        preprocessor_path = os.path.join(self.save_dir, "preprocessor.joblib")
        detector_path = os.path.join(self.save_dir, "anomaly_detector.joblib")
        classifier_path = os.path.join(self.save_dir, "threat_classifier.joblib")
        
        joblib.dump(preprocessor, preprocessor_path)
        detector.save(detector_path)
        classifier.save(classifier_path)
        
        print(f"Saved serialized models to {self.save_dir}")
        
        metrics = {
            "dataset_size": len(logs),
            "test_size": X_test.shape[0],
            "anomalies_flagged": int(num_anomalies),
            "threat_classifier_accuracy": float(accuracy),
            "classification_report": report_dict
        }
        
        return metrics
