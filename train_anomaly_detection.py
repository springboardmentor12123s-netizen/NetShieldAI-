"""
Milestone 2 - Anomaly Detection & Intrusion Prediction training.

Trains:
  1. Isolation Forest  -> unsupervised anomaly detection
  2. Random Forest      -> supervised attack classification (intrusion prediction)
  3. XGBoost            -> supervised attack classification (higher accuracy baseline)

Run this AFTER data_preprocessing.py is correctly pointed at your dataset.

>>> RUN THIS FILE TO TRAIN AND TEST YOUR MODELS <<<
    python ml/train_anomaly_detection.py
"""

import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
from xgboost import XGBClassifier

from data_preprocessing import load_raw_dataset, clean_dataset, encode_and_scale

# CHANGE THIS: where trained models get saved
MODEL_DIR = "./ml/models"
os.makedirs(MODEL_DIR, exist_ok=True)

# CHANGE THIS: fraction of data held out for testing
TEST_SIZE = 0.2
RANDOM_STATE = 42


def train_and_evaluate():
    # ---- Step 1: Load & preprocess -----------------------------------
    print("Loading dataset...")
    raw_df = load_raw_dataset()
    clean_df = clean_dataset(raw_df)
    X, y, label_encoder, scaler, feature_names = encode_and_scale(clean_df)

    # ---- Step 2: Train/test split --------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    # ---- Step 3: Isolation Forest (unsupervised anomaly detection) -----
    print("\nTraining Isolation Forest (anomaly detection)...")
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    iso_forest.fit(X_train)
    # Isolation Forest outputs -1 for anomaly, 1 for normal -> convert to 0/1
    iso_preds_raw = iso_forest.predict(X_test)
    iso_preds = [1 if p == -1 else 0 for p in iso_preds_raw]
    print("Isolation Forest flagged", sum(iso_preds), "anomalies out of", len(iso_preds))

    # ---- Step 4: Random Forest (supervised intrusion prediction) -------
    print("\nTraining Random Forest classifier (intrusion prediction)...")
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        class_weight="balanced",
    )
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    print_metrics("Random Forest", y_test, rf_preds)

    # ---- Step 5: XGBoost (supervised, usually best accuracy) -----------
    print("\nTraining XGBoost classifier (attack classification)...")
    xgb_model = XGBClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.1,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        eval_metric="mlogloss",
    )
    xgb_model.fit(X_train, y_train)
    xgb_preds = xgb_model.predict(X_test)
    print_metrics("XGBoost", y_test, xgb_preds)

    # ---- Step 6: Save everything needed for inference later ------------
    joblib.dump(iso_forest, os.path.join(MODEL_DIR, "isolation_forest.pkl"))
    joblib.dump(rf_model, os.path.join(MODEL_DIR, "random_forest.pkl"))
    joblib.dump(xgb_model, os.path.join(MODEL_DIR, "xgboost_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(label_encoder, os.path.join(MODEL_DIR, "label_encoder.pkl"))
    joblib.dump(feature_names, os.path.join(MODEL_DIR, "feature_names.pkl"))

    print(f"\nAll models saved to: {MODEL_DIR}")


def print_metrics(model_name, y_true, y_pred):
    print(f"\n--- {model_name} results ---")
    print("Accuracy: ", round(accuracy_score(y_true, y_pred), 4))
    print("Precision:", round(precision_score(y_true, y_pred, average="weighted", zero_division=0), 4))
    print("Recall:   ", round(recall_score(y_true, y_pred, average="weighted", zero_division=0), 4))
    print("F1-score: ", round(f1_score(y_true, y_pred, average="weighted", zero_division=0), 4))
    print("\nClassification report:")
    print(classification_report(y_true, y_pred, zero_division=0))
    print("Confusion matrix:")
    print(confusion_matrix(y_true, y_pred))


if __name__ == "__main__":
    train_and_evaluate()
