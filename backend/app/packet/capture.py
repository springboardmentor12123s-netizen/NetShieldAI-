from scapy.all import sniff

from app.packet.live_predictor import (
    predict_live_packet,
    create_alert
)


def process_packet(packet):

    try:

        result = predict_live_packet(packet)

        if result:

            create_alert(result)

            print("\n--- LIVE PREDICTION ---")
            print("Attack:", result["prediction"])
            print("Confidence:", result["confidence"])

    except Exception as e:

        print("Packet processing error:", e)


def start_capture():

    print("Starting live AI monitoring...")

    sniff(
        prn=process_packet,
        store=False
    )