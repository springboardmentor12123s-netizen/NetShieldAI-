from scapy.all import IP, TCP, UDP


def extract_features(packet):

    features = {}

    # Destination Port
    if TCP in packet:
        features["Destination Port"] = packet[TCP].dport
    elif UDP in packet:
        features["Destination Port"] = packet[UDP].dport
    else:
        features["Destination Port"] = 0

    # Length
    features["Total Length Fwd Packets"] = len(packet)

    # Fill remaining model features with 0
    return features