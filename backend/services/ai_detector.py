import pandas as pd
from datetime import datetime

from routes.ai import (
    classifier,
    iso_model,
    get_recommendation,
    prediction_history,
)

from services.alert_engine import AlertEngine

from data.threat_timeline import timeline
from data.threat_stats import attack_stats


# Prevent duplicate alerts
last_prediction = {
    "threat": None,
    "severity": None,
}


def process_packet(features: dict):

    try:

        # ------------------------------------
        # Remove IPs before prediction
        # ------------------------------------

        model_features = features.copy()

        source_ip = model_features.pop("srcip", "Unknown")
        destination_ip = model_features.pop("dstip", "Unknown")

        # ------------------------------------
        # Run AI Models
        # ------------------------------------

        df = pd.DataFrame([model_features])

        threat_id = int(classifier.predict(df)[0])

        confidence = float(
            classifier.predict_proba(df).max()
        )

        anomaly = iso_model.predict(df)[0]

        # ------------------------------------
        # Threat Mapping
        # ------------------------------------

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

        # ------------------------------------
        # Risk Calculation
        # ------------------------------------

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

        # ------------------------------------
        # Save Prediction
        # ------------------------------------

        entry = {
            "time": datetime.now().strftime("%H:%M:%S"),
            "threat": threat,
            "confidence": round(confidence * 100, 2),
            "risk": risk,
            "severity": severity,
            "anomaly": bool(anomaly == -1),
            "recommendation": recommendation,
            "source_ip": source_ip,
            "destination_ip": destination_ip,
        }

        prediction_history.insert(0, entry)
        prediction_history[:] = prediction_history[:20]

        # ------------------------------------
        # Update Threat Timeline
        # ------------------------------------

        timeline.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "risk": risk
        })

        timeline[:] = timeline[-100:]

        # ------------------------------------
        # Update Threat Statistics
        # ------------------------------------

        if threat in attack_stats:
            attack_stats[threat] += 1

        # ------------------------------------
        # Prevent Duplicate Alerts
        # ------------------------------------

        duplicate = (
            last_prediction["threat"] == threat
            and last_prediction["severity"] == severity
        )

        # ------------------------------------
        # Create Alert & Incident
        # ------------------------------------

        if risk >= 40 and not duplicate:

            AlertEngine.create_alert(
                attack=threat,
                confidence=entry["confidence"],
                risk=risk,
                severity=severity,
                recommendation=recommendation,
                source_ip=source_ip,
                destination_ip=destination_ip,
            )

            last_prediction["threat"] = threat
            last_prediction["severity"] = severity

        return entry

    except Exception as e:

        print("\n==============================")
        print("AI Detector Error")
        print("==============================")
        print(e)
        print("==============================\n")

        return None