import os
import joblib
import pandas as pd

from app.packet.feature_extractor import extract_features
from app.database.database import SessionLocal
from app.database.models import Alert

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.join(BASE_DIR, "..", "ai")


model = joblib.load(
    os.path.join(AI_DIR, "model.pkl")
)

encoder = joblib.load(
    os.path.join(AI_DIR, "label_encoder.pkl")
)


def predict_live_packet(packet):

    features = extract_features(packet)

    if features is None:
        return None


    df = pd.DataFrame([features])


    prediction = model.predict(df)[0]


    predicted_label = encoder.inverse_transform(
        [prediction]
    )[0]


    probabilities = model.predict_proba(df)[0]

    confidence = float(
        probabilities.max() * 100
    )


    return {
        "prediction": predicted_label,
        "confidence": round(confidence, 2),
        "features": features
    }
def create_alert(prediction_result):

    if prediction_result["prediction"] == "BENIGN":
        return


    db = SessionLocal()

    try:

        alert = Alert(

            attack_type=prediction_result["prediction"],

            severity="HIGH",

            confidence=prediction_result["confidence"],

            source="Live Network Traffic",

            status="Open"

        )


        db.add(alert)

        db.commit()


    finally:

        db.close()