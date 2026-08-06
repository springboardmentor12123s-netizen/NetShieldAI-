"""Trainer class to load CIC-IDS-2017 CSVs, train ML models, and serialize assets."""

import os
import json
import glob
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import numpy as np
import joblib

from app.ai.preprocessing.preprocessor import (
    NetworkTrafficPreprocessor,
    CATEGORY_NAMES,
)
from app.ai.models.anomaly_detector import AnomalyDetector
from app.ai.models.threat_classifier import ThreatClassifier


# Maximum rows to sample for training (to fit in memory)
MAX_TRAINING_ROWS = 200_000


class ModelTrainer:
    def __init__(self, contamination: float = 0.05, n_estimators: int = 200):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.save_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "models", "saved",
        )
        self.dataset_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "datasets", "Network Intrusion dataset(CIC-IDS- 2017)",
        )

    def load_data_from_csv(self) -> pd.DataFrame:
        """Load and concatenate all CIC-IDS-2017 CSV files."""
        csv_pattern = os.path.join(self.dataset_dir, "*.csv")
        csv_files = sorted(glob.glob(csv_pattern))

        if not csv_files:
            raise FileNotFoundError(
                f"No CSV files found in {self.dataset_dir}. "
                "Please place the CIC-IDS-2017 dataset files there."
            )

        print(f"Found {len(csv_files)} CSV files in dataset directory:")
        frames = []
        for csv_path in csv_files:
            fname = os.path.basename(csv_path)
            print(f"  Loading {fname}...")
            try:
                df = pd.read_csv(csv_path, encoding="utf-8", low_memory=False)
                df.columns = df.columns.str.strip()
                print(f"    -> {len(df)} rows loaded")
                frames.append(df)
            except Exception as e:
                print(f"    WARNING: Error loading {fname}: {e}")

        if not frames:
            raise ValueError("Could not load any CSV files.")

        combined = pd.concat(frames, ignore_index=True)
        print(f"\nTotal rows loaded: {len(combined)}")

        # Drop rows where Label is missing
        if "Label" in combined.columns:
            combined = combined.dropna(subset=["Label"])

        return combined

    def _stratified_sample(self, df: pd.DataFrame, max_rows: int) -> pd.DataFrame:
        """Stratified sampling to keep class balance while limiting size."""
        if len(df) <= max_rows:
            return df

        print(f"Sampling {max_rows} rows from {len(df)} (stratified by Label)...")

        # Make sure labels are strings for grouping
        df["Label"] = df["Label"].astype(str).str.strip()

        # Calculate per-class sample counts proportional to original distribution
        label_counts = df["Label"].value_counts()
        sample_ratio = max_rows / len(df)

        sampled_frames = []
        for label, count in label_counts.items():
            n_sample = max(int(count * sample_ratio), 1)  # At least 1 per class
            label_df = df[df["Label"] == label]
            if len(label_df) <= n_sample:
                sampled_frames.append(label_df)
            else:
                sampled_frames.append(label_df.sample(n=n_sample, random_state=42))

        sampled = pd.concat(sampled_frames, ignore_index=True)
        print(f"Sampled {len(sampled)} rows.")
        return sampled

    def train_and_evaluate(self) -> dict:
        """Runs the full training and evaluation pipeline on CIC-IDS-2017 data."""
        print("=" * 60)
        print("Loading CIC-IDS-2017 dataset from CSV files...")
        print("=" * 60)

        # Step 1: Load data
        raw_df = self.load_data_from_csv()

        # Step 2: Stratified sample if too large
        df = self._stratified_sample(raw_df, MAX_TRAINING_ROWS)

        total_rows = len(df)
        if total_rows < 10:
            raise ValueError(
                f"Insufficient data: only {total_rows} rows after cleanup."
            )

        # Step 3: Preprocess features
        print("\nPreprocessing features...")
        preprocessor = NetworkTrafficPreprocessor()
        X = preprocessor.fit_transform_dataframe(df)
        y = preprocessor.extract_labels_from_dataframe(df)

        print(f"Feature matrix shape: {X.shape}")
        print(f"Label distribution:")
        unique, counts = np.unique(y, return_counts=True)
        for u, c in zip(unique, counts):
            name = CATEGORY_NAMES.get(u, f"Unknown({u})")
            print(f"  {name} (class {u}): {c} samples ({c/len(y)*100:.1f}%)")

        # Step 4: Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42,
            stratify=y if len(np.unique(y)) > 1 else None,
        )
        print(f"\nTrain set: {X_train.shape[0]} samples")
        print(f"Test set:  {X_test.shape[0]} samples")

        # Step 5: Anomaly Detector (Isolation Forest — unsupervised)
        print("\nFitting IsolationForest Anomaly Detector...")
        detector = AnomalyDetector(contamination=self.contamination)
        detector.fit(X_train)

        anomaly_preds = detector.predict(X_test)
        num_anomalies = int(np.sum(anomaly_preds == -1))
        print(f"Anomaly Detector flagged {num_anomalies}/{X_test.shape[0]} test samples as anomalies.")

        # Step 6: Threat Classifier (Random Forest — supervised)
        print("\nFitting RandomForest Threat Classifier...")
        classifier = ThreatClassifier(n_estimators=self.n_estimators)
        classifier.fit(X_train, y_train)

        y_pred = classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        unique_classes = np.unique(np.concatenate([y_test, y_pred]))
        target_names = [classifier.get_label_name(c) for c in unique_classes]

        report_str = classification_report(
            y_test, y_pred,
            labels=unique_classes,
            target_names=target_names,
            output_dict=False,
            zero_division=0,
        )
        report_dict = classification_report(
            y_test, y_pred,
            labels=unique_classes,
            target_names=target_names,
            output_dict=True,
            zero_division=0,
        )

        print("\n" + "=" * 60)
        print("RandomForest Classification Report")
        print("=" * 60)
        print(report_str)

        # Step 7: Save models
        os.makedirs(self.save_dir, exist_ok=True)

        preprocessor_path = os.path.join(self.save_dir, "preprocessor.joblib")
        detector_path = os.path.join(self.save_dir, "anomaly_detector.joblib")
        classifier_path = os.path.join(self.save_dir, "threat_classifier.joblib")

        joblib.dump(preprocessor, preprocessor_path)
        detector.save(detector_path)
        classifier.save(classifier_path)

        print(f"\nSaved models to {self.save_dir}")

        metrics = {
            "dataset_size": total_rows,
            "total_csv_rows": len(raw_df),
            "test_size": X_test.shape[0],
            "n_features": X.shape[1],
            "anomalies_flagged": num_anomalies,
            "threat_classifier_accuracy": float(accuracy),
            "classification_report": report_dict,
        }

        return metrics
