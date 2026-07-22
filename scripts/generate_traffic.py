"""NetShield AI - Real-time Network Traffic Simulator Script."""

import asyncio
import os
import random
import sys
import time
from datetime import datetime, timezone
import requests

# Append backend to py path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

# Assets details
INTERNAL_IPS = [f"192.168.1.{i}" for i in range(10, 50)] + [f"10.0.0.{i}" for i in range(5, 25)]
EXTERNAL_IPS = [
    "8.8.8.8", "8.8.4.4", "1.1.1.1", "142.250.190.46",
    "157.240.22.35", "185.199.108.153", "34.120.177.193",
    "203.0.113.88", "198.51.100.41", "45.33.32.156",
]
PROTOCOLS = ["TCP", "UDP", "ICMP"]
COUNTRIES = ["US", "DE", "CN", "GB", "NL", "JP", "RU", "FR", "CA", "IN"]


def generate_packet() -> dict:
    """Generate a single random network traffic packet dictionary matching MongoDB schema."""
    is_internal = random.random() < 0.75
    src = random.choice(INTERNAL_IPS) if is_internal else random.choice(EXTERNAL_IPS)
    dst = random.choice(INTERNAL_IPS) if not is_internal else random.choice(EXTERNAL_IPS)

    if src == dst:
        dst = "8.8.8.8"

    proto = random.choice(PROTOCOLS)
    if proto == "ICMP":
        src_port = 0
        dst_port = 0
    else:
        src_port = random.choice([80, 443, 22, 53, 8080, 3000] + list(range(49152, 65535)))
        dst_port = random.choice([80, 443, 22, 53, 8080, 3000] + list(range(49152, 65535)))

    sent = random.randint(40, 1500) if proto == "ICMP" else random.randint(100, 1000000)
    recv = random.randint(40, 1500) if proto == "ICMP" else random.randint(100, 2000000)
    packets = random.randint(1, 10) if proto == "ICMP" else random.randint(5, 500)

    # Use ISO formatted timestamp string for JSON over HTTP
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "src_ip": src,
        "dst_ip": dst,
        "src_port": src_port,
        "dst_port": dst_port,
        "protocol": proto,
        "bytes_sent": sent,
        "bytes_received": recv,
        "packet_count": packets,
        "flags": ["SYN", "ACK"] if proto == "TCP" and random.random() > 0.5 else [],
        "duration_ms": random.randint(1, 4000),
        "geo": {
            "src_country": "US" if src.startswith("19") or src.startswith("10") else random.choice(COUNTRIES),
            "dst_country": "US" if dst.startswith("19") or dst.startswith("10") else random.choice(COUNTRIES),
        },
        "metadata": {
            "sensor_id": f"IDS-SENSOR-{random.randint(1, 3)}",
            "interface": "eth0",
        },
    }


def get_auth_token(api_url: str) -> str:
    """Login to obtain a JWT token for ingestion auth."""
    login_url = f"{api_url}/auth/login"
    payload = {"email": "admin@netshield.io", "password": "AdminPassword123!"}
    try:
        r = requests.post(login_url, json=payload, timeout=5)
        r.raise_for_status()
        token = r.json()["data"]["access_token"]
        print("OK: Logged in successfully to API server.")
        return token
    except Exception as e:
        print(f"ERROR: Login failed on {login_url}: {e}")
        return ""


def main():
    import argparse
    parser = argparse.ArgumentParser(description="NetShield AI network packet generator.")
    parser.add_argument("--api-url", default="http://localhost:8000/api/v1", help="Base url for the REST API")
    parser.add_argument("--direct", action="store_true", help="Insert directly to Mongo instead of HTTP")
    parser.add_argument("--interval", type=float, default=1.0, help="Sleep interval in seconds between batches")
    parser.add_argument("--batch-size", type=int, default=10, help="Numbers of packets per batch")
    args = parser.parse_args()

    print(f"Starting traffic simulation. Mode: {'Direct MongoDB' if args.direct else 'HTTP API Gateway'}")

    if args.direct:
        # Import mongo managers
        from app.core.mongodb import MongoDBManager
        from app.repositories.traffic_repository import TrafficRepository

        async def run_direct():
            await MongoDBManager.connect()
            db = MongoDBManager.get_database()
            repo = TrafficRepository(db)
            try:
                while True:
                    batch = []
                    for _ in range(args.batch_size):
                        p = generate_packet()
                        # Convert ISO timestamp string back to datetime object for MongoDB
                        p["timestamp"] = datetime.fromisoformat(p["timestamp"])
                        batch.append(p)

                    count = await repo.insert_batch(batch)
                    print(f"Direct insertion: seeded {count} flow packets into MongoDB.")
                    await asyncio.sleep(args.interval)
            except KeyboardInterrupt:
                print("Stopping simulator.")
            finally:
                await MongoDBManager.disconnect()

        asyncio.run(run_direct())

    else:
        # Direct HTTP ingest mode
        token = get_auth_token(args.api_url)
        if not token:
            print("ERROR: Cannot start without JWT token. Run `python scripts/seed_db.py` first to seed the admin.")
            sys.exit(1)

        headers = {"Authorization": f"Bearer {token}"}
        ingest_url = f"{args.api_url}/traffic/ingest"

        try:
            while True:
                batch = [generate_packet() for _ in range(args.batch_size)]
                payload = {"packets": batch}
                r = requests.post(ingest_url, json=payload, headers=headers, timeout=5)
                r.raise_for_status()
                print(f"Ingested {len(batch)} packets via API gateway. Response code: {r.status_code}")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("Stopping simulator.")


if __name__ == "__main__":
    main()
