
"""
Synthetic traffic generator.

Generates flow-level records that mimic benign traffic plus a configurable
ratio of attack-like patterns (port scan, DoS burst, brute force, data
exfiltration). Used to populate the dashboard before real CICIDS2017 /
UNSW-NB15 data or live packet capture is wired in, and to give the ML
pipeline something to train/score against in Milestone 2.
"""
import random
from datetime import datetime, timedelta

PROTOCOLS = ["TCP", "UDP", "ICMP"]
COMMON_PORTS = [80, 443, 22, 53, 3389, 21, 25, 3306, 8080, 8443]
ATTACK_TYPES = ["port_scan", "dos_flood", "brute_force", "data_exfiltration"]


def _random_ip(private: bool = True) -> str:
    if private:
        return f"10.0.{random.randint(0, 254)}.{random.randint(1, 254)}"
    return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


def _benign_flow(ts: datetime) -> dict:
    duration = round(random.uniform(0.05, 12.0), 3)
    packet_count = random.randint(4, 400)
    avg_pkt_size = random.uniform(64, 1500)
    byte_count = int(packet_count * avg_pkt_size)
    # Benign traffic is roughly bidirectional — the server responds.
    dst_packet_count = int(packet_count * random.uniform(0.6, 1.4))
    dst_byte_count = int(byte_count * random.uniform(0.8, 2.5))  # responses/downloads often larger
    return {
        "timestamp": ts,
        "src_ip": _random_ip(True),
        "dst_ip": _random_ip(random.random() > 0.3),
        "src_port": random.randint(1024, 65535),
        "dst_port": random.choice(COMMON_PORTS),
        "protocol": random.choice(["TCP", "UDP"]),
        "duration": duration,
        "packet_count": packet_count,
        "byte_count": byte_count,
        "dst_packet_count": dst_packet_count,
        "dst_byte_count": dst_byte_count,
        "packets_per_second": round(packet_count / max(duration, 0.01), 2),
        "bytes_per_second": round(byte_count / max(duration, 0.01), 2),
        "avg_packet_size": round(avg_pkt_size, 2),
        "tcp_flags": random.choice(["SYN,ACK", "ACK", "FIN,ACK", "PSH,ACK"]),
        "source": "synthetic",
        "label": "benign",
    }


def _attack_flow(ts: datetime, attack_type: str) -> dict:
    src = _random_ip(random.random() > 0.5)
    dst = _random_ip(True)

    if attack_type == "port_scan":
        duration = round(random.uniform(0.01, 0.3), 3)
        packet_count = random.randint(1, 3)
        byte_count = packet_count * random.randint(40, 60)
        dst_port = random.randint(1, 65535)
        flags = "SYN"
        # Closed/filtered ports rarely answer a scan — little to no return traffic
        dst_packet_count = random.randint(0, 1)
        dst_byte_count = dst_packet_count * random.randint(40, 60)
    elif attack_type == "dos_flood":
        duration = round(random.uniform(0.01, 1.0), 3)
        packet_count = random.randint(2000, 20000)
        byte_count = packet_count * random.randint(40, 100)
        dst_port = random.choice(COMMON_PORTS)
        flags = "SYN"
        # A flooded target has little capacity left to respond
        dst_packet_count = int(packet_count * random.uniform(0.0, 0.05))
        dst_byte_count = dst_packet_count * random.randint(40, 100)
    elif attack_type == "brute_force":
        duration = round(random.uniform(0.1, 2.0), 3)
        packet_count = random.randint(20, 100)
        byte_count = packet_count * random.randint(60, 150)
        dst_port = random.choice([22, 3389, 21, 3306])
        flags = "PSH,ACK"
        # Login attempts do get responses (auth failures), just smaller than fwd
        dst_packet_count = int(packet_count * random.uniform(0.4, 0.9))
        dst_byte_count = int(byte_count * random.uniform(0.2, 0.6))
    else:  # data_exfiltration
        duration = round(random.uniform(5, 60), 3)
        packet_count = random.randint(500, 5000)
        byte_count = packet_count * random.randint(1200, 1500)
        dst_port = random.choice([443, 21, 22])
        flags = "PSH,ACK"
        # Outbound-heavy: attacker pushes data out, receives only small acks
        dst_packet_count = int(packet_count * random.uniform(0.05, 0.2))
        dst_byte_count = dst_packet_count * random.randint(40, 100)

    return {
        "timestamp": ts,
        "src_ip": src,
        "dst_ip": dst,
        "src_port": random.randint(1024, 65535),
        "dst_port": dst_port,
        "protocol": "TCP",
        "duration": duration,
        "packet_count": packet_count,
        "byte_count": byte_count,
        "dst_packet_count": dst_packet_count,
        "dst_byte_count": dst_byte_count,
        "packets_per_second": round(packet_count / max(duration, 0.01), 2),
        "bytes_per_second": round(byte_count / max(duration, 0.01), 2),
        "avg_packet_size": round(byte_count / max(packet_count, 1), 2),
        "tcp_flags": flags,
        "source": "synthetic",
        "label": attack_type,
    }


def generate_flows(count: int = 200, anomaly_ratio: float = 0.12, start_time: datetime | None = None) -> list[dict]:
    """Generate `count` flow records, anomaly_ratio fraction of which are attack-like."""
    start_time = start_time or datetime.utcnow() - timedelta(minutes=count)
    flows = []
    for i in range(count):
        ts = start_time + timedelta(seconds=i * random.uniform(0.5, 3.0))
        if random.random() < anomaly_ratio:
            flows.append(_attack_flow(ts, random.choice(ATTACK_TYPES)))
        else:
            flows.append(_benign_flow(ts))
    return flows