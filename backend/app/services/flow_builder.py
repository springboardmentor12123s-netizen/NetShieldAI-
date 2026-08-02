from threading import Lock
from datetime import datetime

FLOW_TIMEOUT = 60  # seconds

flows = {}
flow_lock = Lock()


def update_flow(packet):
    key = (
        packet["source_ip"],
        packet["destination_ip"],
        packet["source_port"],
        packet["destination_port"],
        packet["protocol"],
    )

    reverse_key = (
        packet["destination_ip"],
        packet["source_ip"],
        packet["destination_port"],
        packet["source_port"],
        packet["protocol"],
    )

    now = datetime.now()

    with flow_lock:

        if key in flows:
            flow = flows[key]
            direction = "forward"

        elif reverse_key in flows:
            flow = flows[reverse_key]
            direction = "backward"

        else:
            flows[key] = {
                "source_ip": packet["source_ip"],
                "destination_ip": packet["destination_ip"],
                "protocol": packet["protocol"],
                "start_time": now,
                "last_seen": now,
                "Destination Port": packet["destination_port"] or 0,
                "Total Fwd Packets": 0,
                "Total Backward Packets": 0,
                "Total Length of Fwd Packets": 0,
                "Total Length of Bwd Packets": 0,
            }

            flow = flows[key]
            direction = "forward"

        flow["last_seen"] = now

        if direction == "forward":
            flow["Total Fwd Packets"] += 1
            flow["Total Length of Fwd Packets"] += packet["length"]
        else:
            flow["Total Backward Packets"] += 1
            flow["Total Length of Bwd Packets"] += packet["length"]


def remove_expired_flows():
    now = datetime.now()

    expired = []

    for key, flow in flows.items():
        idle_time = (now - flow["last_seen"]).total_seconds()

        if idle_time > FLOW_TIMEOUT:
            expired.append(key)

    for key in expired:
        del flows[key]


def get_flows():

    with flow_lock:

        remove_expired_flows()

        output = []

        for flow in flows.values():

            duration = (
                flow["last_seen"] - flow["start_time"]
            ).total_seconds()

            if duration <= 0:
                duration = 1

            total_bytes = (
                flow["Total Length of Fwd Packets"]
                + flow["Total Length of Bwd Packets"]
            )

            total_packets = (
                flow["Total Fwd Packets"]
                + flow["Total Backward Packets"]
            )

            output.append({

                # metadata
                "source_ip": flow["source_ip"],
                "destination_ip": flow["destination_ip"],
                "protocol": flow["protocol"],

                # ML features
                "Destination Port": flow["Destination Port"],
                "Flow Duration": duration,
                "Total Fwd Packets": flow["Total Fwd Packets"],
                "Total Backward Packets": flow["Total Backward Packets"],
                "Total Length of Fwd Packets": flow["Total Length of Fwd Packets"],
                "Total Length of Bwd Packets": flow["Total Length of Bwd Packets"],
                "Flow Bytes/s": total_bytes / duration,
                "Flow Packets/s": total_packets / duration,

            })

        return output