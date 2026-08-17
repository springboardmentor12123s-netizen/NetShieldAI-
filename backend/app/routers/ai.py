from fastapi import APIRouter
import pandas as pd
import joblib

from app.ai.predictor import predict_attack
from app.schemas.ai import PredictionRequest, PredictionResponse

router = APIRouter(
    prefix="/ai",
    tags=["AI Detection"]
)

DATASET_PATH = "datasets/WebAttacks-Thursday-no-metadata.parquet"


# ---------------------------------------------
# Predict using user input
# ---------------------------------------------
@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):

    result = predict_attack(request.data)

    return PredictionResponse(
        prediction=result["prediction"],
        confidence=result["confidence"],
        risk=result["risk"],
        threat_type=result["threat_type"],
        recommendation=result["recommendation"]
    )


# ---------------------------------------------
# Predict using dataset
# ---------------------------------------------
@router.get("/predict-dataset")
def predict_dataset():

    df = pd.read_parquet(DATASET_PATH)
    df = df.dropna()

    results = []

    for _, row in df.head(20).iterrows():

        features = row.drop("Label").to_dict()

        result = predict_attack(features)

        results.append({
            "Actual Label": row["Label"],
            "Predicted Label": result["prediction"],
            "Confidence": result["confidence"],
            "Risk": result["risk"]
        })

    return results


# ---------------------------------------------
# Model Metrics
# ---------------------------------------------
@router.get("/metrics")
def model_metrics():

    metrics = joblib.load("app/ai/model_metrics.pkl")

    return {
        "accuracy": metrics.get("accuracy", 0),
        "precision_macro": metrics.get("precision_macro", 0),
        "recall_macro": metrics.get("recall_macro", 0),
        "f1_macro": metrics.get("f1_macro", 0),
        "roc_auc": metrics.get("roc_auc"),
        "confusion_matrix": metrics.get("confusion_matrix", []),
        "classification_report": metrics.get(
            "classification_report",
            {}
        )
    }


# ---------------------------------------------
# Anomaly Detection Report
# ---------------------------------------------
@router.get("/intrusion-report")
def intrusion_report():

    df = pd.read_parquet(DATASET_PATH)
    df = df.dropna()

    total_records = 100
    benign = 0
    attacks = 0

    risk_summary = {
        "Low": 0,
        "Medium": 0,
        "High": 0,
        "Critical": 0
    }

    threat_summary = {}

    for _, row in df.sample(total_records, random_state=42).iterrows():

        features = row.drop("Label").to_dict()

        result = predict_attack(features)

        prediction = result["prediction"]
        risk = result["risk"]
        threat = result["threat_type"]

        if prediction == "Benign":
            benign += 1
        else:
            attacks += 1

        risk_summary[risk] += 1

        threat_summary[threat] = threat_summary.get(threat, 0) + 1

    return {
        "records_analyzed": total_records,
        "normal_traffic": benign,
        "attacks_detected": attacks,
        "detection_rate": round((attacks / total_records) * 100, 2),
        "risk_summary": risk_summary,
        "threat_summary": threat_summary
    }