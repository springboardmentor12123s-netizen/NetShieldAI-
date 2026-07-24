import os
import sys

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../.."
        )
    )
)

from scapy.all import sniff
from scapy.layers.inet import IP

from app.database import SessionLocal
from app.models.anomaly import Anomaly
from app.models.network_packet import NetworkPacket

from app.packet_capture.flow_builder import (
    update_flow,
    flows,
)

from app.packet_capture.flow_timeout import (
    get_expired_flows,
)

from app.packet_capture.predictor import predict_flow


db = SessionLocal()


def process_packet(packet):

    if IP not in packet:
        return

    flow = update_flow(packet)

    # ---------------------------------
    # Save every captured packet
    # ---------------------------------

    packet_row = NetworkPacket(

        source_ip=packet[IP].src,

        destination_ip=packet[IP].dst,

        protocol=flow.protocol,

        packet_size=len(packet),

        status="Captured",

    )

    db.add(packet_row)
    db.commit()

    # ---------------------------------
    # Check completed flows
    # ---------------------------------

    expired = get_expired_flows(flows)

    for key, flow in expired:

        result = predict_flow(flow)

        anomaly = Anomaly(

            source_ip=flow.client_ip,

            destination_ip=flow.server_ip,

            anomaly_type=result["attack"],

            confidence_score=result["confidence"],

            status="Detected",

        )

        db.add(anomaly)
        db.commit()

        print()

        print("=" * 60)
        print("FLOW COMPLETED")
        print("=" * 60)

        print("Client :", flow.client_ip)
        print("Server :", flow.server_ip)
        print("Protocol :", flow.protocol)
        print("Forward Packets :", flow.forward_packets)
        print("Backward Packets :", flow.backward_packets)
        print("Prediction :", result["attack"])
        print("Confidence :", round(result["confidence"], 4))

        print("=" * 60)

        del flows[key]


def start_capture():

    print("Professional Flow IDS Started...\n")

    sniff(
        prn=process_packet,
        store=False,
    )


if __name__ == "__main__":
    start_capture()