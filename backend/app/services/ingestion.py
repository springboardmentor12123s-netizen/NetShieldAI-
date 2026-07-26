import os
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from app.database import mongo_db

CHUNK_SIZE = 50000

def _clean(v):
    if pd.isna(v): return None
    if isinstance(v, (np.integer, np.floating)): v = v.item()
    if isinstance(v, float) and (v == float('inf') or v == float('-inf')): return None
    return v

def _safe_int(v):
    try: return int(float(v))
    except (ValueError, TypeError): return None

async def ingest_cicids2017_file(file_path: str):
    if not os.path.exists(file_path): raise FileNotFoundError(file_path)
    coll = mongo_db.traffic
    known = {"Timestamp", "Source IP", "Source Port", "Destination IP", "Destination Port", "Protocol", "Label"}
    for chunk in pd.read_csv(file_path, chunksize=CHUNK_SIZE, low_memory=False):
        chunk.columns = [c.strip() for c in chunk.columns]
        records = []
        for _, row in chunk.iterrows():
            ts = pd.to_datetime(row.get("Timestamp"), errors="coerce")
            if pd.isna(ts): ts = datetime.now(timezone.utc)
            lbl = str(row.get("Label")).strip() if pd.notna(row.get("Label")) else "UNKNOWN"
            rec = {
                "timestamp": ts, "source_ip": row.get("Source IP"), "source_port": _safe_int(row.get("Source Port")),
                "destination_ip": row.get("Destination IP"), "destination_port": _safe_int(row.get("Destination Port")),
                "protocol": str(row.get("Protocol")) if pd.notna(row.get("Protocol")) else None,
                "dataset_source": "CICIDS2017", "label": lbl,
                "is_anomaly": lbl.upper() != "BENIGN", "features": {}, "created_at": datetime.now(timezone.utc)
            }
            for col in chunk.columns:
                if col not in known:
                    val = _clean(row.get(col))
                    if val is not None: rec["features"][col] = val
            records.append(rec)
        if records: await coll.insert_many(records)

async def ingest_unsw_nb15_file(file_path: str):
    if not os.path.exists(file_path): raise FileNotFoundError(file_path)
    coll = mongo_db.traffic
    known = {"srcip", "sport", "dstip", "dsport", "proto", "label", "attack_cat", "stime"}
    for chunk in pd.read_csv(file_path, chunksize=CHUNK_SIZE, low_memory=False):
        chunk.columns = [c.strip().lower() for c in chunk.columns]
        records = []
        for _, row in chunk.iterrows():
            label_val = row.get("label")
            attack_cat = row.get("attack_cat")
            is_anomaly = False
            final_label = "BENIGN"
            if pd.notna(label_val):
                is_anomaly = int(float(label_val)) == 1
                if is_anomaly and pd.notna(attack_cat):
                    final_label = str(attack_cat).strip().lower()
                elif is_anomaly:
                    final_label = "ATTACK"
            ts = row.get("stime")
            timestamp = datetime.fromtimestamp(float(ts), tz=timezone.utc) if pd.notna(ts) else datetime.now(timezone.utc)
            rec = {
                "timestamp": timestamp, "source_ip": row.get("srcip"), "source_port": _safe_int(row.get("sport")),
                "destination_ip": row.get("dstip"), "destination_port": _safe_int(row.get("dsport")),
                "protocol": str(row.get("proto")) if pd.notna(row.get("proto")) else None,
                "dataset_source": "UNSW-NB15", "label": final_label,
                "is_anomaly": is_anomaly, "features": {}, "created_at": datetime.now(timezone.utc)
            }
            for col in chunk.columns:
                if col not in known:
                    val = _clean(row.get(col))
                    if val is not None: rec["features"][col] = val
            records.append(rec)
        if records: await coll.insert_many(records)
