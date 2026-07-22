"""Loader module to parse and ingest CICIDS2017 and UNSWNB15 datasets."""

import os
import csv
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from app.core.mongodb import MongoDBManager
from app.repositories.traffic_repository import TrafficRepository


class DatasetLoader:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.cicids_path = os.path.join(self.base_dir, "cicids2017_sample.csv")
        self.unsw_path = os.path.join(self.base_dir, "unswnb15_sample.csv")

    def _resolve_protocol(self, proto_val: str) -> str:
        """Resolve protocol numeric identifier or string (e.g. 6 -> TCP)."""
        val = proto_val.strip().upper()
        if val in ["6", "TCP"]:
            return "TCP"
        elif val in ["17", "UDP"]:
            return "UDP"
        elif val in ["1", "ICMP"]:
            return "ICMP"
        return val

    def load_cicids(self) -> List[Dict[str, Any]]:
        """Parse CICIDS2017 sample CSV file and map to traffic log format."""
        logs = []
        if not os.path.exists(self.cicids_path):
            print(f"Error: CICIDS2017 sample CSV file not found at {self.cicids_path}")
            return logs

        now = datetime.now(timezone.utc)
        with open(self.cicids_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            # Normalize headers by stripping whitespace
            fieldnames = [name.strip() for name in (reader.fieldnames or [])]
            
            for idx, row in enumerate(reader):
                # Re-clean keys to match stripped headers
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                
                src_ip = clean_row.get("Source IP", "0.0.0.0")
                dst_ip = clean_row.get("Destination IP", "0.0.0.0")
                src_port = int(clean_row.get("Source Port", "0"))
                dst_port = int(clean_row.get("Destination Port", "0"))
                protocol = self._resolve_protocol(clean_row.get("Protocol", "TCP"))
                duration = int(float(clean_row.get("Flow Duration", "0"))) // 1000  # ms
                
                fwd_pkts = int(clean_row.get("Total Fwd Packets", "0"))
                bwd_pkts = int(clean_row.get("Total Backward Packets", "0"))
                pkt_count = fwd_pkts + bwd_pkts
                
                bytes_sent = int(clean_row.get("Total Length of Fwd Packets", "0"))
                bytes_received = int(clean_row.get("Total Length of Bwd Packets", "0"))
                
                syn_flag = int(clean_row.get("SYN Flag Count", "0"))
                ack_flag = int(clean_row.get("ACK Flag Count", "0"))
                flags = []
                if syn_flag > 0:
                    flags.append("SYN")
                if ack_flag > 0:
                    flags.append("ACK")
                
                label = clean_row.get("Label", "BENIGN")
                
                # Mock geographic localization
                geo = {
                    "src_country": "US" if src_ip.startswith("192.168") else "CN",
                    "dst_country": "US"
                }

                # Spread timestamps over the last hour
                log_time = now - timedelta(seconds=idx * 60)

                logs.append({
                    "timestamp": log_time,
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "src_port": src_port,
                    "dst_port": dst_port,
                    "protocol": protocol,
                    "bytes_sent": bytes_sent,
                    "bytes_received": bytes_received,
                    "packet_count": pkt_count or 1,
                    "flags": flags,
                    "duration_ms": duration,
                    "geo": geo,
                    "metadata": {
                        "dataset": "CICIDS2017",
                        "label": label,
                        "sensor_id": "IDS-CICIDS-SENSOR-1"
                    }
                })
        return logs

    def load_unsw(self) -> List[Dict[str, Any]]:
        """Parse UNSW-NB15 sample CSV file and map to traffic log format."""
        logs = []
        if not os.path.exists(self.unsw_path):
            print(f"Error: UNSW-NB15 sample CSV file not found at {self.unsw_path}")
            return logs

        now = datetime.now(timezone.utc)
        with open(self.unsw_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                
                src_ip = clean_row.get("srcip", "0.0.0.0")
                dst_ip = clean_row.get("dstip", "0.0.0.0")
                src_port = int(clean_row.get("sport", "0"))
                dst_port = int(clean_row.get("dsport", "0"))
                protocol = self._resolve_protocol(clean_row.get("proto", "TCP"))
                duration = int(float(clean_row.get("dur", "0")) * 1000)  # to ms
                
                bytes_sent = int(clean_row.get("sbytes", "0"))
                bytes_received = int(clean_row.get("dbytes", "0"))
                
                spkts = int(clean_row.get("spkts", "0"))
                dpkts = int(clean_row.get("dpkts", "0"))
                pkt_count = spkts + dpkts
                
                attack_cat = clean_row.get("attack_cat", "Normal")
                label = int(clean_row.get("label", "0"))
                
                geo = {
                    "src_country": "US" if src_ip.startswith("10.") else "CN",
                    "dst_country": "US"
                }

                # Spread timestamps over the last hour (shift slightly to avoid overlap)
                log_time = now - timedelta(seconds=idx * 60 + 30)

                logs.append({
                    "timestamp": log_time,
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "src_port": src_port,
                    "dst_port": dst_port,
                    "protocol": protocol,
                    "bytes_sent": bytes_sent,
                    "bytes_received": bytes_received,
                    "packet_count": pkt_count or 1,
                    "flags": [],
                    "duration_ms": duration,
                    "geo": geo,
                    "metadata": {
                        "dataset": "UNSWNB15",
                        "attack_category": attack_cat,
                        "label_binary": label,
                        "sensor_id": "IDS-UNSW-SENSOR-1"
                    }
                })
        return logs

    async def ingest_all(self) -> Dict[str, int]:
        """Ingest both datasets into MongoDB."""
        cicids_records = self.load_cicids()
        unsw_records = self.load_unsw()
        
        await MongoDBManager.connect()
        db = MongoDBManager.get_database()
        repo = TrafficRepository(db)
        
        cicids_count = 0
        unsw_count = 0
        
        if cicids_records:
            cicids_count = await repo.insert_batch(cicids_records)
            print(f"Ingested {cicids_count} records from CICIDS2017.")
            
        if unsw_records:
            unsw_count = await repo.insert_batch(unsw_records)
            print(f"Ingested {unsw_count} records from UNSW-NB15.")
            
        return {
            "cicids2017": cicids_count,
            "unswnb15": unsw_count
        }
