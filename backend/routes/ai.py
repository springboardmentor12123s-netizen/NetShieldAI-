import os
import joblib
import pandas as pd

from datetime import datetime
from fastapi import APIRouter

from ml.recommendation import get_recommendation
from services.alert_engine import AlertEngine

router = APIRouter(prefix="/ai", tags=["AI"])

prediction_history = []

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

classifier = joblib.load(
    os.path.join(BASE_DIR, "ml/models/threat_classifier.pkl")
)
print("\n==============================")
print("Expected Features")
print("==============================")

try:
    print(classifier.feature_names_in_)
except Exception:
    print("Model does not expose feature names.")

print("==============================\n")

attack_encoder = joblib.load(
    os.path.join(BASE_DIR, "ml/models/attack_encoder.pkl")
)

iso_model = joblib.load(
    os.path.join(BASE_DIR, "ml/models/isolation_forest.pkl")
)


@router.get("/status")
def status():
    return {
        "status": "AI Models Running"
    }


@router.get("/model-info")
def model_info():
    return {
        "Threat Classification Accuracy": "75.47%",
        "Attack Detection Accuracy": "87.26%",
        "Models": [
            "Random Forest",
            "Isolation Forest"
        ]
    }


@router.get("/history")
def history():
    return prediction_history


@router.post("/predict")
def predict(sample: dict):

    df = pd.DataFrame([sample])

    threat_id = int(classifier.predict(df)[0])

    threat_map = {
        0: "Analysis",
        1: "Backdoor",
        2: "DoS",
        3: "Exploits",
        4: "Fuzzers",
        5: "Generic",
        6: "Normal",
        7: "Reconnaissance",
        8: "Shellcode",
        9: "Worms",
    }

    threat = threat_map.get(threat_id, "Unknown")

    confidence = float(classifier.predict_proba(df).max())

    anomaly = iso_model.predict(df)[0]

    risk = int(confidence * 100)

    if anomaly == -1:
        risk += 15

    risk = min(risk, 100)

    if risk >= 85:
        severity = "Critical"
    elif risk >= 65:
        severity = "High"
    elif risk >= 40:
        severity = "Medium"
    else:
        severity = "Low"

    recommendation = get_recommendation(threat)

    entry = {
        "time": datetime.now().strftime("%H:%M:%S"),
        "threat": threat,
        "confidence": round(confidence * 100, 2),
        "risk": risk,
        "severity": severity,
        "anomaly": bool(anomaly == -1),
        "recommendation": recommendation
    }

    prediction_history.insert(0, entry)

    if len(prediction_history) > 20:
        prediction_history.pop()

    # ----------------------------
    # Create Alert Automatically
    # ----------------------------

    if risk >= 40:

        AlertEngine.create_alert(
            attack=threat,
            confidence=entry["confidence"],
            risk=entry["risk"],
            severity=severity,
            recommendation=recommendation
        )

    return entry