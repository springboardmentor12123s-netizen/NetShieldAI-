import os
import time
import pickle
import threading
import numpy as np
import pandas as pd
from datetime import datetime

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw, get_working_ifaces
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

from backend.database import get_db, SessionLocal, mongo_db
from backend.models import Alert, Incident

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

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
        features[f'payload_byte_{i}'] = 0.0
    payload_slice = raw_payload[:1500]
    for i, byte in enumerate(payload_slice):
        features[f'payload_byte_{i+1}'] = float(byte)

    return features, src_ip, dst_ip, src_port, dst_port, payload_len

def process_live_packet(pkt):
    global sniffed_packet_count, detected_threat_count
    if not scaler or not rf_clf or not feature_columns:
        return

    try:
        features, src_ip, dst_ip, src_port, dst_port, payload_len = extract_live_packet_features(pkt)
        sniffed_packet_count += 1
        
        vec = np.array([features.get(col, 0.0) for col in feature_columns], dtype=np.float32)
        X_vec = scaler.transform(vec.reshape(1, -1))
        proba = rf_clf.predict_proba(X_vec)[0]
        rf_pred_idx = np.argmax(proba)
        confidence = float(proba[rf_pred_idx])
        
        raw_label = attack_classes[rf_pred_idx] if attack_classes and rf_pred_idx < len(attack_classes) else rf_pred_idx
        raw_label_str = str(raw_label).strip().lower()
        
        if raw_label_str in ['1', '1.0', 'attack'] and confidence >= 0.75:
            is_attack = True
        elif raw_label_str not in ['1', '1.0', 'attack'] and "normal" not in raw_label_str and "benign" not in raw_label_str and confidence >= 0.75:
            is_attack = True
        else:
            is_attack = False
            
        if is_attack:
            proto_name = "TCP" if features.get('protocol') == 6.0 else ("UDP" if features.get('protocol') == 17.0 else "OTHER")
            if proto_name == "TCP" and dst_port in [80, 443]:
                predicted_label = "Web Attack"
            elif proto_name == "TCP" and dst_port == 22:
                predicted_label = "SSH Brute Force"
            elif proto_name == "UDP" and payload_len > 800:
                predicted_label = "DDoS Flood"
            elif dst_port in [3389, 21, 23]:
                predicted_label = "Brute Force Scan"
            else:
                predicted_label = "DDoS Flood" if payload_len > 600 else "PortScan"
        else:
            predicted_label = "Normal"
        
        iso_score = 0.0
        if iso_forest:
            raw_score = iso_forest.decision_function(X_vec)[0]
            is_iso_anomaly = raw_score < -0.12
            iso_score = 0.85 if is_iso_anomaly else 0.15

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
                raw_score = raw_score if iso_forest else 0.0
                if raw_score < -0.18 or payload_len > 1000:
                    severity = "Critical"
                elif raw_score < -0.12 or dst_port in [22, 3389, 80, 443]:
                    severity = "High"
                elif raw_score < -0.05:
                    severity = "Medium"
                else:
                    severity = "Low"
                alert_entry = Alert(
                    severity=severity,
                    message=f"Live Wi-Fi Packet Sniffer detected real-time {predicted_label} signature from {src_ip}",
                    source_ip=src_ip,
                    status="Active"
                )
                db.add(alert_entry)
                db.commit()
                db.refresh(alert_entry)

                incident_entry = Incident(
                    title=f"Sniffer Threat: {predicted_label} from {src_ip}",
                    alert_id=alert_entry.id,
                    status="Open"
                )
                db.add(incident_entry)
                db.commit()
            except Exception as e:
                db.rollback()
            finally:
                db.close()

    except Exception as e:
        pass

def _sniff_loop():
    global is_sniffing
    
    iface_target = None
    try:
        for iface in get_working_ifaces():
            if "wifi" in iface.name.lower() or "ethernet" in iface.name.lower():
                iface_target = iface.name
                break
    except Exception as e:
        try:
            with open("backend/sniffer_debug.log", "a") as f:
                f.write(f"[{datetime.now()}] Interface detection error: {e}\n")
        except:
            pass

    try:
        with open("backend/sniffer_debug.log", "a") as f:
            f.write(f"[{datetime.now()}] Sniffer loop started. Selected Interface: {iface_target}\n")
    except:
        pass

    while is_sniffing:
        try:
            if iface_target:
                sniff(iface=iface_target, count=10, prn=process_live_packet, store=False, timeout=3)
            else:
                sniff(count=10, prn=process_live_packet, store=False, timeout=3)
        except Exception as e:
            try:
                with open("backend/sniffer_debug.log", "a") as f:
                    f.write(f"[{datetime.now()}] Sniff loop error: {e}\n")
            except:
                pass
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
    global is_sniffing, sniffer_thread
    is_sniffing = False
    if sniffer_thread and sniffer_thread.is_alive():
        try:
            sniffer_thread.join(timeout=4)
        except Exception:
            pass
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
