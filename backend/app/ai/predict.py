import os
import joblib
import pandas as pd


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    CURRENT_DIR,
    "model.pkl"
)

ENCODER_PATH = os.path.join(
    CURRENT_DIR,
    "label_encoder.pkl"
)


model = joblib.load(MODEL_PATH)

encoder = joblib.load(ENCODER_PATH)


FEATURES = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
]


def predict_attack(data):

    input_data = pd.DataFrame([data])

    input_data = input_data[FEATURES]

    prediction = model.predict(input_data)

    probabilities = model.predict_proba(input_data)

    confidence = float(
        probabilities[0].max() * 100
    )

    result = encoder.inverse_transform(prediction)

    return {
        "prediction": result[0],
        "confidence": round(confidence, 2)
    }