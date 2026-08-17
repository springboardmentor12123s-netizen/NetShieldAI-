from threading import Lock
from datetime import datetime

from app.ai.predict import predict_attack
from app.services.flow_builder import get_flows
from app.services.alert_service import create_alert

prediction_cache = {}

prediction_lock = Lock()

PREDICTION_REFRESH_TIME = 10

CACHE_EXPIRATION_TIME = 60

def get_severity(prediction: str):

    prediction = prediction.upper()

    if prediction == "BENIGN":
        return "LOW"

    elif "DDOS" in prediction:
        return "CRITICAL"

    elif "DOS" in prediction:
        return "HIGH"

    elif "PORTSCAN" in prediction:
        return "MEDIUM"

    elif "BOT" in prediction:
        return "HIGH"

    elif "WEB" in prediction:
        return "HIGH"

    else:
        return "MEDIUM"

def get_flow_key(flow):

    return (
        flow["source_ip"],
        flow["destination_ip"],
        flow["protocol"],
        flow["Destination Port"],
    )

def cleanup_prediction_cache():

    now = datetime.now()

    expired_keys = []

    with prediction_lock:

        for key, cached in prediction_cache.items():

            age = (
                now - cached["timestamp"]
            ).total_seconds()

            if age > CACHE_EXPIRATION_TIME:

                expired_keys.append(key)


        for key in expired_keys:

            del prediction_cache[key]


    if expired_keys:

        print(
            f"CACHE CLEANUP | "
            f"Removed {len(expired_keys)} expired prediction(s)"
        )

def predict_live_traffic(db):

    cleanup_prediction_cache()

    flows = get_flows()

    predictions = []

    now = datetime.now()

    for flow in flows:

        flow_key = get_flow_key(flow)

        with prediction_lock:

            cached = prediction_cache.get(flow_key)

        if cached:

            age = (
                now - cached["timestamp"]
            ).total_seconds()


            if age < PREDICTION_REFRESH_TIME:

                print(
                    f"CACHE HIT | "
                    f"{flow['source_ip']} -> "
                    f"{flow['destination_ip']} | "
                    f"Port: {flow['Destination Port']} | "
                    f"Prediction: {cached['prediction']} | "
                    f"Confidence: {cached['confidence']}%"
                )


                predictions.append({

                    "source_ip":
                        flow["source_ip"],

                    "destination_ip":
                        flow["destination_ip"],

                    "protocol":
                        flow["protocol"],

                    "destination_port":
                        flow["Destination Port"],

                    "prediction":
                        cached["prediction"],

                    "confidence":
                        cached["confidence"],

                    "severity":
                        cached["severity"],

                    "status":
                        (
                            "Threat Detected"
                            if cached["prediction"].upper() != "BENIGN"
                            else "Normal Traffic"
                        ),

                    "cached":
                        True,

                })

                continue

        print(
            f"CACHE MISS | "
            f"{flow['source_ip']} -> "
            f"{flow['destination_ip']} | "
            f"Port: {flow['Destination Port']} | "
            f"Running AI model..."
        )

        features = {

            "Destination Port":
                flow["Destination Port"],

            "Flow Duration":
                flow["Flow Duration"],

            "Total Fwd Packets":
                flow["Total Fwd Packets"],

            "Total Backward Packets":
                flow["Total Backward Packets"],

            "Total Length of Fwd Packets":
                flow["Total Length of Fwd Packets"],

            "Total Length of Bwd Packets":
                flow["Total Length of Bwd Packets"],

            "Flow Bytes/s":
                flow["Flow Bytes/s"],

            "Flow Packets/s":
                flow["Flow Packets/s"],

        }

        result = predict_attack(features)

        if isinstance(result, dict):

            attack = result.get(
                "prediction",
                "BENIGN"
            )

            confidence = float(
                result.get(
                    "confidence",
                    0
                )
            )

        else:

            attack = result

            confidence = 0

        severity = get_severity(attack)

        print(
            f"AI RESULT | "
            f"Prediction: {attack} | "
            f"Confidence: {confidence:.2f}%"
        )

        with prediction_lock:

            prediction_cache[flow_key] = {

                "prediction":
                    attack,

                "confidence":
                    confidence,

                "severity":
                    severity,

                "timestamp":
                    now,

            }

        if attack.upper() != "BENIGN":

            create_alert(

                db=db,

                source_ip=
                    flow["source_ip"],

                destination_ip=
                    flow["destination_ip"],

                protocol=
                    flow["protocol"],

                attack_type=
                    attack,

                severity=
                    severity,

            )
        
        predictions.append({

            "source_ip":
                flow["source_ip"],

            "destination_ip":
                flow["destination_ip"],

            "protocol":
                flow["protocol"],

            "destination_port":
                flow["Destination Port"],

            "prediction":
                attack,

            "confidence":
                confidence,

            "severity":
                severity,

            "status":
                (
                    "Threat Detected"
                    if attack.upper() != "BENIGN"
                    else "Normal Traffic"
                ),

            "cached":
                False,

        })


    return predictions