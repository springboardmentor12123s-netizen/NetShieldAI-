import subprocess
import json
import time
import random
from database import SessionLocal
from models import Alert
from ai_engine import predict_threat
from notifications import send_alert_email

# CONFIGURATION
INTERFACE_ID = "6"  # Your Wi-Fi adapter number
PACKET_COUNT = 10   # Capture 10 real packets before analyzing them

def analyze_flows(packets):
    """Extracts network flows from tshark JSON output."""
    flows = {}
    
    for pkt in packets:
        try:
            layers = pkt.get("_source", {}).get("layers", {})
            # Capture both TCP and UDP!
            if "ip" in layers and ("tcp" in layers or "udp" in layers):
                src_ip = layers["ip"].get("ip.src", "Unknown")
                dst_ip = layers["ip"].get("ip.dst", "Unknown")
                protocol = "TCP" if "tcp" in layers else "UDP"
                flow_key = (src_ip, dst_ip, protocol)
                
                if flow_key not in flows:
                    flows[flow_key] = []
                    
                pkt_len = int(layers.get("frame", {}).get("frame.len", "0")[0])
                timestamp = float(layers.get("frame", {}).get("frame.time_epoch", "0")[0])
                flows[flow_key].append({"len": pkt_len, "time": timestamp})
        except Exception:
            continue
            
    print(f"[*] Found {len(flows)} unique IP flows from real traffic.")
    
    db = SessionLocal()
    try:
        for (src_ip, dst_ip, protocol), pkts in flows.items():
            if len(pkts) < 2:
                continue

            timestamps = [p["time"] for p in pkts]
            flow_duration = (max(timestamps) - min(timestamps)) * 1000  # in ms
            
            total_fwd_packets = len(pkts)
            total_backward_packets = len(pkts) 
            fwd_packet_lengths = [p["len"] for p in pkts]
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
            
            try:
                if prediction["risk_score"] >= 90: severity = "Critical"
                elif prediction["risk_score"] >= 75: severity = "High"
                elif prediction["risk_score"] > 50: severity = "Medium"
                else: severity = "Low"

                # Save IPs and Protocol in the flow_id separated by hyphens
                # Example: "192.168.1.5-142.250.1.1-TCP"
                new_alert = Alert(
                    flow_id=f"{src_ip}-{dst_ip}-{protocol}",
                    severity=severity,
                    threat_type=prediction["threat_classification"],
                    risk_score=prediction["risk_score"],
                    status="New" if prediction["risk_score"] > 50 else "Info"
                )
                db.add(new_alert)
                db.commit()

                # Send email for real critical threats
                if prediction["risk_score"] >= 75:
                    send_alert_email(prediction["threat_classification"], prediction["risk_score"], src_ip, dst_ip)
                
                if prediction["risk_score"] > 50:
                    print(f"[!] REAL THREAT DETECTED: {prediction['threat_classification']} [{src_ip} -> {dst_ip}] (Risk: {prediction['risk_score']})")
                else:
                    print(f"[*] Normal flow saved: {src_ip} -> {dst_ip} ({protocol}) (Risk: {prediction['risk_score']})")
                    
            except Exception as e:
                print(f"[-] Error saving alert to DB: {e}")
                db.rollback()
                
    except Exception as e:
        print(f"[-] Error during analysis: {e}")
        db.rollback()
    finally:
        db.close()

def start_capture():
    print(f"[*] Starting Wireshark (tshark) Live Capture on Interface {INTERFACE_ID}...")
    print("[!] Open a website in your browser to generate traffic!")
    
    while True:
        try:
            # Run tshark command directly via subprocess using the full executable path
            cmd = [r"C:\Program Files\Wireshark\tshark.exe", "-i", INTERFACE_ID, "-c", str(PACKET_COUNT), "-T", "json", "-f", "ip"]
            process = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
            
            if process.stdout:
                # tshark outputs a JSON array
                packets = json.loads(process.stdout)
                if len(packets) > 0:
                    analyze_flows(packets)
                else:
                    print("[*] No packets captured. Try browsing a website.")
            else:
                print(f"[-] tshark error: {process.stderr}")
                
            time.sleep(2)
            
        except KeyboardInterrupt:
            print("\n[*] Stopping packet capture. Goodbye!")
            break
        except json.JSONDecodeError:
            print("[*] Waiting for valid packet data...")
            time.sleep(2)

if __name__ == "__main__":
    start_capture()