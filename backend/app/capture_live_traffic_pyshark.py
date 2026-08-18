import asyncio
import sys

# CRITICAL FIX FOR PYTHON 3.10+: Manually create the event loop before importing pyshark
if sys.version_info >= (3, 10):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

# Now we can safely import pyshark
import pyshark
from collections import defaultdict
from database import SessionLocal
from models import Alert
from ai_engine import predict_threat
import random
import time

# CONFIGURATION
# You MUST change this to your exact interface name from 'get_if_list()'
INTERFACE_NAME = "\\Device\\NPF_{0B6603C1-5EFA-4D15-9C88-4C5882EEFE75}"
PACKET_COUNT = 50  # Analyze every 50 packets captured

def analyze_flows(packets):
    flows = defaultdict(list)
    
    for pkt in packets:
        try:
            if hasattr(pkt, 'ip') and hasattr(pkt, 'tcp'):
                src_ip = pkt.ip.src
                dst_ip = pkt.ip.dst
                flow_key = (src_ip, dst_ip)
                flows[flow_key].append(pkt)
        except AttributeError:
            continue
            
    print(f"[*] Found {len(flows)} unique IP flows.")
    
    db = SessionLocal()
    try:
        for (src_ip, dst_ip), pkts in flows.items():
            if len(pkts) < 2:
                continue

            timestamps = [float(pkt.sniff_timestamp) for pkt in pkts]
            flow_duration = (max(timestamps) - min(timestamps)) * 1000
            
            total_fwd_packets = len(pkts)
            total_backward_packets = len(pkts)
            fwd_packet_lengths = [int(pkt.captured_length) for pkt in pkts]
            fwd_packet_length_max = max(fwd_packet_lengths)
            fwd_packet_length_mean = sum(fwd_packet_lengths) / len(fwd_packet_lengths)
            
            if flow_duration == 0: flow_duration = 1
            flow_bytes_per_sec = sum(fwd_packet_lengths) / (flow_duration / 1000)
            flow_packets_per_sec = total_fwd_packets / (flow_duration / 1000)

            flow_features = {
                'Flow duration': flow_duration,
                'Total fwd packets': total_fwd_packets,
                'Total backward packets': total_backward_packets,
                'Fwd packet length max': fwd_packet_length_max,
                'Fwd packet length mean': fwd_packet_length_mean,
                'Flow bytes/s': flow_bytes_per_sec,
                'Flow packets/s': flow_packets_per_sec
            }

            prediction = predict_threat(flow_features)
            
            if prediction["risk_score"] > 50:
                print(f"[!] THREAT DETECTED: {prediction['threat_classification']} from {src_ip} to {dst_ip} (Risk: {prediction['risk_score']})")
                
                if prediction["risk_score"] >= 90: severity = "Critical"
                elif prediction["risk_score"] >= 75: severity = "High"
                else: severity = "Medium"

                new_alert = Alert(
                    flow_id=f"{src_ip}-{dst_ip}-{random.randint(1000,9999)}",
                    severity=severity,
                    threat_type=prediction["threat_classification"],
                    risk_score=prediction["risk_score"],
                    status="New"
                )
                db.add(new_alert)
                db.commit()
                print("[+] Alert successfully saved to database.")
            else:
                print(f"[*] Normal Flow: {src_ip} -> {dst_ip} (Risk: {prediction['risk_score']})")
                
    except Exception as e:
        print(f"[-] Error during analysis: {e}")
        db.rollback()
    finally:
        db.close()

def start_capture():
    print(f"[*] Starting PyShark Capture on Interface '{INTERFACE_NAME}'...")
    print("[!] If it fails immediately, change INTERFACE_NAME to your exact \\Device\\NPF_ string.")
    
    try:
        while True:
            capture = pyshark.LiveCapture(interface=INTERFACE_NAME)
            
            print(f"[*] Waiting for {PACKET_COUNT} packets... (Open a website in your browser!)")
            # Use synchronous sniff
            capture.sniff(packet_count=PACKET_COUNT)
            
            packets = list(capture)
            
            if len(packets) > 0:
                analyze_flows(packets)
            else:
                print(f"[*] No packets captured. (Interface {INTERFACE_NAME} might be wrong)")
                
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Stopping packet capture. Goodbye!")

if __name__ == "__main__":
    start_capture()