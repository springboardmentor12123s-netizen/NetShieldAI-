import joblib
import os
import pandas as pd

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
    # 1. Extract features in the EXACT order and case our model expects
    feature_order = [
        'Flow duration', 'Total fwd packets', 'Total backward packets',
        'Fwd packet length max', 'Fwd packet length mean',
        'Flow bytes/s', 'Flow packets/s'
    ]
    
    # Create a Pandas DataFrame to satisfy the scaler
    features_df = pd.DataFrame([flow_features], columns=feature_order)

    # 2. Scale the features
    scaled_features = scaler.transform(features_df)

    # 3. Model 1: Anomaly Detection (Isolation Forest)
    is_anomaly = iso_forest.predict(scaled_features)[0] == -1

    # 4. Model 2: Threat Classification (Random Forest)
    prediction_encoded = rf_classifier.predict(scaled_features)[0]
    threat_label = label_encoder.inverse_transform([prediction_encoded])[0]

    # 5. HEURISTIC OVERRIDE (Demo Reliability)
    bytes_per_sec = flow_features.get('Flow bytes/s', 0)
    packets_per_sec = flow_features.get('Flow packets/s', 0)
    flow_duration = flow_features.get('Flow duration', 0)
    total_fwd_packets = flow_features.get('Total fwd packets', 0)

    # Only override if the ML model classifies as BENIGN but the features are extreme
    if threat_label == "BENIGN":
        if bytes_per_sec > 5000000 or packets_per_sec > 50000:
            # Extreme volume = DDoS
            threat_label = "DDoS"
            is_anomaly = True
        elif total_fwd_packets > 500 and flow_duration < 5000:
            # Many packets in very short time = PortScan
            threat_label = "PortScan"
            is_anomaly = True
        elif total_fwd_packets < 50 and flow_duration > 80000:
            # Long duration, few packets = BruteForce
            threat_label = "BruteForce"
            is_anomaly = True

    # 6. Calculate Risk Score (0-100)
    if threat_label == "BENIGN" and not is_anomaly:
        risk_score = 5  # Completely normal
    elif threat_label == "BENIGN" and is_anomaly:
        risk_score = 40 # Statistically weird, but classified as benign
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