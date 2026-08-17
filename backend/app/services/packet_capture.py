from scapy.all import sniff, IP, TCP, UDP
from threading import Thread, Lock
from datetime import datetime
from app.services.flow_builder import update_flow

live_packets = []

packet_lock = Lock()

MAX_PACKETS = 500


def process_packet(packet):

    if IP not in packet:
        return

    source_port = None
    destination_port = None
    protocol = "OTHER"

    if TCP in packet:
        source_port = packet[TCP].sport
        destination_port = packet[TCP].dport
        protocol = "TCP"

    elif UDP in packet:
        source_port = packet[UDP].sport
        destination_port = packet[UDP].dport
        protocol = "UDP"

    packet_info = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "source_ip": packet[IP].src,
        "destination_ip": packet[IP].dst,
        "source_port": source_port,
        "destination_port": destination_port,
        "protocol": protocol,
        "length": len(packet)
    }
    update_flow(packet_info)
    with packet_lock:

        live_packets.append(packet_info)

        if len(live_packets) > MAX_PACKETS:
            live_packets.pop(0)


def start_packet_capture():

    sniff(
        prn=process_packet,
        store=False
    )


def run_packet_capture():

    capture_thread = Thread(
        target=start_packet_capture,
        daemon=True
    )

    capture_thread.start()


def get_live_packets():

    with packet_lock:
        return list(reversed(live_packets))