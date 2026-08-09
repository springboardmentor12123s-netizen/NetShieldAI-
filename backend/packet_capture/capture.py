from scapy.all import sniff
from packet_capture.analyzer import extract_features
from ml.predict import predict_attack
from services.threat_state import save_threat


def process(packet):

    try:

        features = extract_features(packet)

        result = predict_attack(features)

        attack = result["attack"]
        confidence = result["confidence"]

        save_threat(
            attack,
            confidence
        )

        print("--------------------------------")
        print("Attack :", attack)
        print("Confidence :", confidence, "%")
        print("--------------------------------")

    except Exception as e:

        print("Detection Error:", e)


def start_capture():

    sniff(
        prn=process,
        store=False
    )


if __name__ == "__main__":

    print("Starting Live Capture...")

    start_capture()