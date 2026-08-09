import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

MODEL = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
ENCODER = joblib.load(os.path.join(BASE_DIR, "label_encoder.pkl"))
FEATURES = joblib.load(os.path.join(BASE_DIR, "feature_columns.pkl"))


def predict_attack(feature_dict):

    df = pd.DataFrame([feature_dict])

    # Ensure all expected columns exist
    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0

    df = df[FEATURES]

    prediction = MODEL.predict(df)[0]

    attack = ENCODER.inverse_transform([prediction])[0]

    probability = MODEL.predict_proba(df).max()

    return {
        "attack": attack,
        "confidence": round(float(probability * 100), 2)
    }