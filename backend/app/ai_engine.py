import joblib
import os
import numpy as np

# Load the saved models and preprocessors
MODELS_PATH = os.path.join(os.path.dirname(__file__), 'ml_models')

scaler = joblib.load(os.path.join(MODELS_PATH, 'scaler.pkl'))
iso_forest = joblib.load(os.path.join(MODELS_PATH, 'anomaly_detector.pkl'))
rf_classifier = joblib.load(os.path.join(MODELS_PATH, 'threat_classifier.pkl'))
label_encoder = joblib.load(os.path.join(MODELS_PATH, 'label_encoder.pkl'))

def predict_threat(flow_features: dict) -> dict:
    """
    Takes a dictionary of network flow features, runs it through the AI models,
    and returns an anomaly status, threat classification, and risk score.
    """
    # 1. Extract features in the exact order our model expects
    feature_order = [
        ' Flow Duration', ' Total Fwd Packets', ' Total Backward Packets',
        ' Fwd Packet Length Max', ' Fwd Packet Length Mean',
        'Flow Bytes/s', ' Flow Packets/s'
    ]
    
    features_array = np.array([[flow_features.get(feat, 0) for feat in feature_order]])

    # 2. Scale the features (crucial step!)
    scaled_features = scaler.transform(features_array)

    # 3. Model 1: Anomaly Detection (Isolation Forest)
    # Isolation forest returns 1 for normal, -1 for anomaly
    is_anomaly = iso_forest.predict(scaled_features)[0] == -1

    # 4. Model 2: Threat Classification (Random Forest)
    # Predict the class (returns an encoded number like 0, 1, 2)
    prediction_encoded = rf_classifier.predict(scaled_features)[0]
    threat_label = label_encoder.inverse_transform([prediction_encoded])[0]

    # 5. Calculate Risk Score (0-100)
    if threat_label == "BENIGN" and not is_anomaly:
        risk_score = 5  # Completely normal
    elif threat_label == "BENIGN" and is_anomaly:
        risk_score = 40 # Statistically weird, but classified as benign (Zero-day suspicion?)
    elif threat_label in ["PortScan", "BruteForce"]:
        risk_score = 75 # High risk
    elif threat_label == "DDoS":
        risk_score = 95 # Critical risk
    else:
        risk_score = 50 # Unknown anomaly

    return {
        "is_anomaly": bool(is_anomaly),
        "threat_classification": threat_label,
        "risk_score": risk_score
    }