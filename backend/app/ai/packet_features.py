import time

previous_time = time.time()


def extract_features(packet, feature_columns):
    global previous_time

    now = time.time()
    duration = now - previous_time
    previous_time = now

    features = {feature: 0 for feature in feature_columns}

    # Protocol
    if hasattr(packet, "tcp"):
        features["Protocol"] = 6
    elif hasattr(packet, "udp"):
        features["Protocol"] = 17
    else:
        features["Protocol"] = 0

    # Flow Duration
    features["Flow Duration"] = duration

    # Packet Counts
    features["Total Fwd Packets"] = 1
    features["Subflow Fwd Packets"] = 1
    features["Fwd Act Data Packets"] = 1

    # Packet Length
    if hasattr(packet, "length"):
        length = int(packet.length)
    else:
        length = 0

    features["Packet Length Min"] = length
    features["Packet Length Max"] = length
    features["Packet Length Mean"] = length
    features["Avg Packet Size"] = length

    features["Fwd Packets Length Total"] = length
    features["Fwd Packet Length Max"] = length
    features["Fwd Packet Length Min"] = length
    features["Fwd Packet Length Mean"] = length
    features["Avg Fwd Segment Size"] = length

    # Flow Rates
    if duration > 0:
        features["Flow Bytes/s"] = length / duration
        features["Flow Packets/s"] = 1 / duration
        features["Fwd Packets/s"] = 1 / duration

    return features