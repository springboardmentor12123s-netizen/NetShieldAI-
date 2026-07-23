import os
import time
import pickle
import threading
import numpy as np
import pandas as pd
from datetime import datetime

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

from backend.database import get_db, SessionLocal, mongo_db
from backend.models import Alert

MODEL_DIR = os.path.join("backend", "models")

def load_pkl(filename):
    path = os.path.join(MODEL_DIR, filename)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return None

scaler          = load_pkl("scaler.pkl")
rf_clf          = load_pkl("random_forest.pkl")
iso_forest      = load_pkl("isolation_forest.pkl")
feature_columns = load_pkl("feature_columns.pkl")
attack_classes  = load_pkl("attack_classes.pkl")

is_sniffing = False
sniffer_thread = None
sniffed_packet_count = 0
detected_threat_count = 0

def extract_live_packet_features(pkt):
    features = {}
    if pkt.haslayer(IP):
        ip = pkt[IP]
        features['ttl'] = float(ip.ttl)
        features['total_len'] = float(ip.len)
        features['protocol'] = float(ip.proto)
        src_ip = ip.src
        dst_ip = ip.dst
    else:
        features['ttl'] = 64.0
        features['total_len'] = float(len(pkt))
        features['protocol'] = 0.0
        src_ip = "127.0.0.1"
        dst_ip = "127.0.0.1"
        
    src_port = 0
    dst_port = 0
    if pkt.haslayer(TCP):
        src_port = int(pkt[TCP].sport)
        dst_port = int(pkt[TCP].dport)
    elif pkt.haslayer(UDP):
        src_port = int(pkt[UDP].sport)
        dst_port = int(pkt[UDP].dport)

    raw_payload = bytes(pkt[Raw].load) if pkt.haslayer(Raw) else bytes(pkt)
    payload_len = len(raw_payload)
    
    for i in range(1, 1501):
        idx = i - 1
        features[f'payload_byte_{i}'] = float(raw_payload[idx]) if idx < payload_len else 0.0

    return features, src_ip, dst_ip, src_port, dst_port, payload_len

def process_live_packet(pkt):
    global sniffed_packet_count, detected_threat_count
    if not scaler or not rf_clf or not feature_columns:
        return

    try:
        features, src_ip, dst_ip, src_port, dst_port, payload_len = extract_live_packet_features(pkt)
        sniffed_packet_count += 1
        
        df_vec = pd.DataFrame([features])
        df_vec = df_vec.reindex(columns=feature_columns, fill_value=0.0)
        
        X_vec = scaler.transform(df_vec.values)
        rf_pred_idx = rf_clf.predict(X_vec)[0]
        
        predicted_label = attack_classes[rf_pred_idx] if attack_classes and rf_pred_idx < len(attack_classes) else str(rf_pred_idx)
        is_attack = predicted_label != 'Normal'
        
        iso_score = 0.0
        if iso_forest:
            iso_pred = iso_forest.predict(X_vec)[0]
            iso_score = 0.85 if iso_pred == -1 else 0.15

        if is_attack:
            detected_threat_count += 1
            
        packet_record = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": "TCP" if features.get('protocol') == 6.0 else ("UDP" if features.get('protocol') == 17.0 else "OTHER"),
            "payload_len": payload_len,
            "predicted_label": predicted_label,
            "is_anomaly": is_attack or (iso_score > 0.5),
            "risk_score": 95.0 if is_attack else 12.0
        }
        try:
            mongo_db.packets.insert_one(packet_record)
        except Exception:
            pass

        if is_attack:
            db = SessionLocal()
            try:
                alert_entry = Alert(
                    severity="Critical" if "DDoS" in predicted_label or "Infiltration" in predicted_label else "High",
                    message=f"Live Wi-Fi Packet Sniffer detected real-time {predicted_label} signature from {src_ip}",
                    source_ip=src_ip,
                    status="Active"
                )
                db.add(alert_entry)
                db.commit()
            except Exception as e:
                db.rollback()
            finally:
                db.close()

    except Exception as e:
        pass

def _sniff_loop():
    global is_sniffing
    print("[Sniffer] Live packet sniffing loop started.")
    
    iface_target = None
    try:
        from scapy.all import get_working_ifaces
        for iface in get_working_ifaces():
            if "wifi" in iface.name.lower() or "ethernet" in iface.name.lower():
                iface_target = iface.name
                break
    except Exception:
        pass

    while is_sniffing:
        try:
            if iface_target:
                sniff(iface=iface_target, count=10, prn=process_live_packet, store=False, timeout=3)
            else:
                sniff(count=10, prn=process_live_packet, store=False, timeout=3)
        except Exception as e:
            print(f"[Sniffer Error] {e}")
            time.sleep(1)
    print("[Sniffer] Packet sniffer stopped.")

def start_sniffer():
    global is_sniffing, sniffer_thread
    if not SCAPY_AVAILABLE:
        return False, "Scapy is not installed."
        
    if is_sniffing:
        return True, "Packet sniffer is already running."

    is_sniffing = True
    sniffer_thread = threading.Thread(target=_sniff_loop, daemon=True)
    sniffer_thread.start()
    return True, "Real-time Wi-Fi packet sniffer started successfully."

def stop_sniffer():
    global is_sniffing
    is_sniffing = False
    return True, "Packet sniffer stopped."

def get_sniffer_status():
    return {
        "is_sniffing": is_sniffing,
        "scapy_available": SCAPY_AVAILABLE,
        "total_packets_sniffed": sniffed_packet_count,
        "total_threats_detected": detected_threat_count
    }

def reset_sniffer():
    global sniffed_packet_count, detected_threat_count
    sniffed_packet_count = 0
    detected_threat_count = 0
    return True, "Packet sniffer counters reset to zero."
