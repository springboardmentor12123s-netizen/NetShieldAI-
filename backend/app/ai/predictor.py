import joblib
import pandas as pd

model = joblib.load("app/ai/model.pkl")
label_encoder = joblib.load("app/ai/label_encoder.pkl")
feature_columns = joblib.load("app/ai/feature_columns.pkl")


def predict_attack(data):

    sample = {}

    for feature in feature_columns:
        sample[feature] = data.get(feature, 0)

    sample_df = pd.DataFrame([sample])

    prediction = model.predict(sample_df)[0]
    confidence = model.predict_proba(sample_df).max()

    attack = label_encoder.inverse_transform([prediction])[0]

    confidence = round(float(confidence) * 100, 2)

    # Risk Level
    if attack == "Benign":
        risk = "Low"
    elif confidence >= 95:
        risk = "Critical"
    elif confidence >= 80:
        risk = "High"
    else:
        risk = "Medium"

    # Threat Classification
    if attack == "Benign":
        threat_type = "Normal Traffic"
        recommendation = "No action required."

    elif "Brute Force" in attack:
        threat_type = "Authentication Attack"
        recommendation = "Block the source IP and enable account lockout."

    elif "SQL" in attack:
        threat_type = "Database Attack"
        recommendation = "Validate inputs and use parameterized queries."

    elif "XSS" in attack:
        threat_type = "Web Application Attack"
        recommendation = "Sanitize user input and enable Content Security Policy."

    elif "DoS" in attack or "DDoS" in attack:
        threat_type = "Denial of Service Attack"
        recommendation = "Enable rate limiting and deploy firewall protection."

    else:
        threat_type = "Network Attack"
        recommendation = "Investigate the suspicious traffic."

    return {
        "prediction": attack,
        "confidence": confidence,
        "risk": risk,
        "threat_type": threat_type,
        "recommendation": recommendation
    }