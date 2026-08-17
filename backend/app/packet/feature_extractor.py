from collections import defaultdict
import time


flows = defaultdict(lambda: {
    "start_time": time.time(),
    "fwd_packets": 0,
    "bwd_packets": 0,
    "fwd_bytes": 0,
    "bwd_bytes": 0
})


def extract_features(packet):

    if not packet.haslayer("IP"):
        return None

    src = packet["IP"].src
    dst = packet["IP"].dst

    key = (src, dst)

    flow = flows[key]

    flow["fwd_packets"] += 1

    packet_length = len(packet)

    flow["fwd_bytes"] += packet_length

    duration = time.time() - flow["start_time"]

    if duration == 0:
        duration = 0.001

    

    features = {

        "Destination Port":
            packet.dport if hasattr(packet, "dport") else 0,

        "Flow Duration":
            duration,

        "Total Fwd Packets":
            flow["fwd_packets"],

        "Total Backward Packets":
            flow["bwd_packets"],

        "Total Length of Fwd Packets":
            flow["fwd_bytes"],

        "Total Length of Bwd Packets":
            flow["bwd_bytes"],

        "Flow Bytes/s":
            flow["fwd_bytes"] / duration,

        "Flow Packets/s":
            flow["fwd_packets"] / duration
    }

    

    features["source_ip"] = src

    features["destination_ip"] = dst

    if packet.haslayer("TCP"):
        features["protocol"] = "TCP"

    elif packet.haslayer("UDP"):
        features["protocol"] = "UDP"

    elif packet.haslayer("ICMP"):
        features["protocol"] = "ICMP"

    else:
        features["protocol"] = "OTHER"

    return features