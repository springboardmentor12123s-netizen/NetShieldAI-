import os
import time
import joblib
import pandas as pd

from app.packet.feature_extractor import extract_features
from app.database.database import SessionLocal
from app.database.models import Alert

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.join(BASE_DIR, "..", "ai")

model = joblib.load(
    os.path.join(AI_DIR, "model.pkl")
)

encoder = joblib.load(
    os.path.join(AI_DIR, "label_encoder.pkl")
)

prediction_cache = {}

CACHE_TTL = 30

def predict_live_packet(packet):

    if not packet.haslayer("IP"):
        return None

    src_ip = packet["IP"].src
    dst_ip = packet["IP"].dst

    destination_port = 0

    if hasattr(packet, "dport"):
        try:
            destination_port = int(packet.dport)
        except Exception:
            destination_port = 0

    cache_key = (
        src_ip,
        dst_ip,
        destination_port
    )

    current_time = time.time()

    if cache_key in prediction_cache:

        cached_result, cached_time = prediction_cache[cache_key]

        if current_time - cached_time < CACHE_TTL:

            print(
                f"CACHE HIT | "
                f"{src_ip} -> {dst_ip} | "
                f"Port: {destination_port} | "
                f"Prediction: {cached_result['prediction']} | "
                f"Confidence: {cached_result['confidence']}%"
            )

            return cached_result

        else:

            del prediction_cache[cache_key]


    print(
        f"CACHE MISS | "
        f"{src_ip} -> {dst_ip} | "
        f"Port: {destination_port} | "
        f"Running AI model..."
    )


    features = extract_features(packet)

    if features is None:
        return None


    df = pd.DataFrame([features])

    prediction = model.predict(df)[0]

    predicted_label = encoder.inverse_transform(
        [prediction]
    )[0]

    probabilities = model.predict_proba(df)[0]

    confidence = float(
        probabilities.max() * 100
    )


    result = {

        "source_ip": src_ip,

        "destination_ip": dst_ip,

        "destination_port": destination_port,

        "prediction": predicted_label,

        "confidence": round(confidence, 2),

        "features": features
    }


    prediction_cache[cache_key] = (
        result,
        current_time
    )


    print(
        f"AI RESULT | "
        f"Prediction: {predicted_label} | "
        f"Confidence: {confidence:.2f}%"
    )


    return result

def create_alert(prediction_result):

    if prediction_result["prediction"] == "BENIGN":
        return


    db = SessionLocal()

    try:

        alert = Alert(

            source_ip=prediction_result.get(
                "source_ip"
            ),

            destination_ip=prediction_result.get(
                "destination_ip"
            ),

            protocol="UNKNOWN",

            attack_type=prediction_result["prediction"],

            severity="HIGH",

            status="OPEN"

        )


        db.add(alert)

        db.commit()

        db.refresh(alert)


        print(
            f"🚨 ALERT CREATED | "
            f"{alert.attack_type} | "
            f"Severity: {alert.severity}"
        )


    except Exception as e:

        db.rollback()

        print(
            "Alert creation error:",
            e
        )


    finally:

        db.close()