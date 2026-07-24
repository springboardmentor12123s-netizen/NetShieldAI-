import os
import joblib
import pandas as pd

from app.packet_capture.feature_extractor import extract_features

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../..")
)

MODEL_DIR = os.path.join(BASE_DIR, "ml", "models")

model = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
feature_names = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))


def predict_flow(flow):

    extracted = extract_features(flow)

    row = {}

    missing = []

    for feature in feature_names:

        if feature in extracted:
            row[feature] = extracted[feature]
        else:
            row[feature] = 0
            missing.append(feature)

    if missing:
        print("\n==============================")
        print("Missing Features:", len(missing))
        print("==============================")

        for f in missing:
            print(f)

        print("==============================\n")

    df = pd.DataFrame([row])

    prediction = model.predict(df)[0]

    confidence = model.predict_proba(df).max()

    attack = encoder.inverse_transform([prediction])[0]

    return {
        "attack": attack,
        "confidence": float(confidence),
    }