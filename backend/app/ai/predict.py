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

    # Convert live traffic feature names to training feature names
    input_data = input_data.rename(columns={
        "Destination Port": "destination_port",
        "Flow Duration": "flow_duration",
        "Total Fwd Packets": "total_fwd_packets",
        "Total Backward Packets": "total_backward_packets",
        "Total Length of Fwd Packets": "total_length_fwd_packets",
        "Total Length of Bwd Packets": "total_length_backward_packets",
        "Flow Bytes/s": "flow_bytes_per_sec",
        "Flow Packets/s": "flow_packets_per_sec"
    })


    prediction = model.predict(
        input_data
    )

    result = encoder.inverse_transform(
        prediction
    )

    return result[0]