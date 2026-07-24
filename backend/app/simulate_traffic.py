import random
import time
from datetime import datetime, timedelta
from mongo_db import flows_collection

# Realistic IP addresses and ports to simulate a corporate network
INTERNAL_IPS = ["192.168.1.10", "192.168.1.45", "192.168.1.102", "10.0.0.15"]
EXTERNAL_IPS = ["203.0.113.5", "198.51.100.12", "185.220.101.34", "45.33.32.156"]
PROTOCOLS = ["TCP", "UDP", "ICMP"]
PORTS = [80, 443, 22, 3389, 8080, 53, 25]
ATTACK_LABELS = ["BENIGN", "BENIGN", "BENIGN", "BENIGN", "BENIGN", "DDoS", "PortScan", "BruteForce"]

def generate_flow():
    """Generates a single realistic network flow record."""
    is_internal = random.choice([True, False])
    
    src_ip = random.choice(INTERNAL_IPS)
    dst_ip = random.choice(EXTERNAL_IPS) if is_internal else random.choice(INTERNAL_IPS)
    
    # If it's an attack, make the destination IP one of our internal servers
    label = random.choice(ATTACK_LABELS)
    if label != "BENIGN":
        dst_ip = random.choice(INTERNAL_IPS)
        src_ip = random.choice(EXTERNAL_IPS)

    return {
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": random.randint(49152, 65535),
        "dst_port": random.choice(PORTS),
        "protocol": random.choice(PROTOCOLS),
        "flow_duration": random.randint(50, 50000), # in milliseconds
        "total_fwd_packets": random.randint(1, 50),
        "total_bytes": random.randint(64, 10000),
        "label": label, # BENIGN or Attack Type
        "timestamp": datetime.utcnow() - timedelta(seconds=random.randint(0, 60))
    }

def inject_traffic(num_flows=100):
    """Injects simulated network flows into MongoDB."""
    print(f"Injecting {num_flows} simulated network flows into MongoDB...")
    
    flow_data = [generate_flow() for _ in range(num_flows)]
    
    # Insert all generated flows into the database
    result = flows_collection.insert_many(flow_data)
    print(f"Successfully injected {len(result.inserted_ids)} flows.")

if __name__ == "__main__":
    # Run this script directly to populate the database
    inject_traffic(200)