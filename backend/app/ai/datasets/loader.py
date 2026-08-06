"""Loader module to read CIC-IDS-2017 dataset and ingest into MongoDB."""

import os
import glob
import pandas as pd
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.core.mongodb import MongoDBManager
from app.repositories.traffic_repository import TrafficRepository
from app.ai.preprocessing.preprocessor import LABEL_MAP


class DatasetLoader:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.dataset_dir = os.path.join(
            self.base_dir, "Network Intrusion dataset(CIC-IDS- 2017)"
        )

    def _resolve_protocol(self, proto_val) -> str:
        """Resolve protocol numeric identifier or string."""
        val = str(proto_val).strip().upper()
        if val in ["6", "TCP"]:
            return "TCP"
        elif val in ["17", "UDP"]:
            return "UDP"
        elif val in ["1", "ICMP"]:
            return "ICMP"
        return val

    def load_cicids(self, max_rows: int = 5000) -> List[Dict[str, Any]]:
        """Load a sample of CIC-IDS-2017 records for MongoDB ingestion.

        This is used to seed the database with representative traffic logs
        for the dashboard UI, NOT for model training (which uses CSV directly).
        """
        csv_pattern = os.path.join(self.dataset_dir, "*.csv")
        csv_files = sorted(glob.glob(csv_pattern))

        if not csv_files:
            print(f"Error: No CSV files found in {self.dataset_dir}")
            return []

        logs = []
        per_file_limit = max(max_rows // len(csv_files), 100)
        now = datetime.now(timezone.utc)

        for csv_path in csv_files:
            try:
                df = pd.read_csv(csv_path, encoding="utf-8", low_memory=False,
                                 nrows=per_file_limit)
                df.columns = df.columns.str.strip()
            except Exception as e:
                print(f"Error loading {os.path.basename(csv_path)}: {e}")
                continue

            for idx, row in df.iterrows():
                label = str(row.get("Label", "BENIGN")).strip()

                dst_port = int(float(row.get("Destination Port", 0)))
                fwd_pkts = int(float(row.get("Total Fwd Packets", 0)))
                bwd_pkts = int(float(row.get("Total Backward Packets", 0)))
                fwd_bytes = int(float(row.get("Total Length of Fwd Packets", 0)))
                bwd_bytes = int(float(row.get("Total Length of Bwd Packets", 0)))
                duration = int(float(row.get("Flow Duration", 0))) // 1000

                syn_flag = int(float(row.get("SYN Flag Count", 0)))
                ack_flag = int(float(row.get("ACK Flag Count", 0)))
                flags = []
                if syn_flag > 0:
                    flags.append("SYN")
                if ack_flag > 0:
                    flags.append("ACK")

                from datetime import timedelta
                log_time = now - timedelta(seconds=len(logs) * 2)

                logs.append({
                    "timestamp": log_time,
                    "src_ip": "10.0.0.1",  # CIC-IDS-2017 doesn't include IPs in public CSVs
                    "dst_ip": "192.168.10.50",
                    "src_port": 0,
                    "dst_port": dst_port,
                    "protocol": "TCP",
                    "bytes_sent": fwd_bytes,
                    "bytes_received": bwd_bytes,
                    "packet_count": fwd_pkts + bwd_pkts or 1,
                    "flags": flags,
                    "duration_ms": duration,
                    "geo": {"src_country": "US", "dst_country": "US"},
                    "metadata": {
                        "dataset": "CICIDS2017",
                        "label": label,
                        "sensor_id": "IDS-CICIDS-SENSOR-1",
                    },
                })

                if len(logs) >= max_rows:
                    break

            if len(logs) >= max_rows:
                break

        print(f"Loaded {len(logs)} records from CIC-IDS-2017 dataset.")
        return logs

    async def ingest_all(self) -> Dict[str, int]:
        """Ingest CIC-IDS-2017 sample records into MongoDB."""
        records = self.load_cicids()

        await MongoDBManager.connect()
        db = MongoDBManager.get_database()
        repo = TrafficRepository(db)

        count = 0
        if records:
            count = await repo.insert_batch(records)
            print(f"Ingested {count} records from CIC-IDS-2017.")

        return {"cicids2017": count}
