import os
import joblib
import pandas as pd


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))


MODEL_PATH = os.path.join(
    CURRENT_DIR,
    "models",
    "intrusion_model.pkl"
)

ENCODER_PATH = os.path.join(
    CURRENT_DIR,
    "models",
    "label_encoder.pkl"
)


model = joblib.load(MODEL_PATH)

encoder = joblib.load(ENCODER_PATH)


def predict_attack(data):

    input_data = pd.DataFrame(
        [data]
    )

    prediction = model.predict(
        input_data
    )

    result = encoder.inverse_transform(
        prediction
    )

    return result[0]