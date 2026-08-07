import pyshark
import joblib
import requests
from datetime import datetime
from app.ai.packet_features import extract_features
from app.ai.predictor import predict_attack

TSHARK_PATH = r"C:\Program Files\Wireshark\tshark.exe"

feature_columns = joblib.load("app/ai/feature_columns.pkl")

capture = pyshark.LiveCapture(
    interface="Wi-Fi",
    tshark_path=TSHARK_PATH
)

print("Capturing live packets... Press Ctrl+C to stop.")

try:
    for packet in capture.sniff_continuously():

        try:
            if hasattr(packet, "ip"):

                # Extract packet features
                features = extract_features(packet, feature_columns)

                # Predict attack
                result = predict_attack(features)

                # Prepare payload for FastAPI
                payload = {
    "timestamp": datetime.now().strftime("%H:%M:%S"),
    "prediction": result["prediction"],
    "confidence": result["confidence"],
    "risk": result["risk"],
    "threat_type": result["threat_type"],
    "recommendation": result["recommendation"],
    "source": packet.ip.src,
    "destination": packet.ip.dst,
    "protocol": packet.highest_layer
}

                # Send latest prediction to FastAPI
                try:
                    requests.post(
                        "http://127.0.0.1:8000/traffic/live/update",
                        json=payload,
                        timeout=2
                    )
                except Exception as e:
                    print("Failed to send prediction:", e)

                # Print prediction
                print("=" * 60)
                print(f"Source      : {packet.ip.src}")
                print(f"Destination : {packet.ip.dst}")
                print(f"Prediction  : {result['prediction']}")
                print(f"Confidence  : {result['confidence']}%")
                print(f"Risk        : {result['risk']}")
                print(f"Threat      : {result['threat_type']}")
                print(f"Advice      : {result['recommendation']}")

        except Exception as e:
            print("Packet Error:", e)

except KeyboardInterrupt:
    print("\nCapture stopped.")