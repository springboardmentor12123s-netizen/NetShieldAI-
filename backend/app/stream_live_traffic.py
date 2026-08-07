import time
import random
from datetime import datetime, timedelta
from mongo_db import flows_collection

INTERNAL_IPS = ["192.168.1.10", "10.0.0.15", "172.16.0.3"]
EXTERNAL_IPS = ["203.0.113.5", "185.220.101.34", "45.33.32.156", "198.51.100.12"]
PROTOCOLS = ["TCP", "UDP"]
PORTS = [80, 443, 22, 3389, 8080, 53]
ATTACK_LABELS = ["BENIGN", "BENIGN", "BENIGN", "BENIGN", "BENIGN", "DDoS", "PortScan", "BruteForce"]

def generate_flow():
    label = random.choice(ATTACK_LABELS)
    src_ip = random.choice(INTERNAL_IPS)
    dst_ip = random.choice(EXTERNAL_IPS)
    
    # If it's an attack, the external IP attacks our internal server
    if label != "BENIGN":
        dst_ip = random.choice(INTERNAL_IPS)
        src_ip = random.choice(EXTERNAL_IPS)

    return {
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": random.randint(49152, 65535),
        "dst_port": random.choice(PORTS),
        "protocol": random.choice(PROTOCOLS),
        "flow_duration": random.randint(50, 50000),
        "total_fwd_packets": random.randint(1, 50) if label == "BENIGN" else random.randint(500, 5000),
        "total_bytes": random.randint(64, 10000) if label == "BENIGN" else random.randint(100000, 500000),
        "label": label,
        "timestamp": datetime.utcnow()
    }

def stream_traffic():
    print("🚀 Starting Live Traffic Streamer...")
    print("New data will appear on your dashboard every 3 seconds!")
    
    # Clear the old static CICIDS data first
    flows_collection.delete_many({})
    
    while True:
        # Generate a small batch of new flows (3-5 at a time)
        batch_size = random.randint(3, 5)
        new_flows = [generate_flow() for _ in range(batch_size)]
        
        # Insert them into MongoDB
        flows_collection.insert_many(new_flows)
        
        # Keep the dashboard snappy by deleting flows older than 2 minutes
        cutoff_time = datetime.utcnow() - timedelta(minutes=2)
        flows_collection.delete_many({"timestamp": {"$lt": cutoff_time}})
        
        print(f"Injected {batch_size} new flows. Total visible: {flows_collection.count_documents({})}")
        
        # Wait 3 seconds before injecting the next batch
        time.sleep(3)

if __name__ == "__main__":
    stream_traffic()