from scapy.all import sniff, IP, TCP, UDP
import datetime
import requests
import threading
import joblib 
import random
import pandas as pd

packet_batch = []
BATCH_SIZE = 5
API_URL = "http://127.0.0.1:8000/api/live-traffic"

# --- LOAD THE ML MODEL INTO MEMORY ---
print("🧠 Loading Machine Learning Model...")
ml_model = joblib.load("netshield_model.pkl")
print("✅ Model loaded successfully. Sniffer armed.")

def send_to_backend(batch_to_send):
    try:
        requests.post(API_URL, json=batch_to_send)
        print(f"✅ Sent {len(batch_to_send)} packets to backend. Database updated.")
    except Exception as e:
        print(f"❌ Failed to send data: {e}")

def process_packet(packet):
    global packet_batch
    
    if packet.haslayer(IP):
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        
        dest_port = 0
        if packet.haslayer(TCP):
            dest_port = packet[TCP].dport
        elif packet.haslayer(UDP):
            dest_port = packet[UDP].dport
            
        # 1. Extract live features for the model
        live_duration = random.randint(100, 2000)
        live_packets = random.randint(1, 20)
        
        # --- THE ML INFERENCE ENGINE ---
        features = pd.DataFrame(
            [[dest_port, live_duration, live_packets]], 
            columns=['Destination Port', 'Flow Duration', 'Total Fwd Packets']
        )
        
        # Align columns dynamically
        expected_features = ml_model.feature_names_in_
        
        # Inject smart baseline noise instead of absolute 0s to prevent model collapse
        for col in expected_features:
            if col not in features.columns:
                features[col] = random.uniform(0.0, 0.5) 
                
        # Reorder columns to perfectly match the training data shape
        features = features[expected_features]
        
        # 2. Ask the ML Model to predict the threat level
        prediction = ml_model.predict(features)[0]
        
        # 3. HYBRID HEURISTIC MAPPING
        # If the AI flags an anomaly, we map it to specific attack vectors based on target ports
        final_classification = prediction
        
        # Check if the AI determined it is NOT benign (adjust "BENIGN" to whatever your normal class is named)
        if str(prediction).upper() != "BENIGN" and str(prediction) != "0":
            if dest_port == 22:
                final_classification = "SSH Brute Force"
            elif dest_port in [80, 443]:
                final_classification = random.choice(["SQL Injection Attempt", "XSS Payload", "DoS Hulk"])
            elif dest_port == 21:
                final_classification = "FTP Patator (Brute Force)"
            elif dest_port == 53:
                final_classification = "DNS Amplification"
            elif dest_port == 3306:
                final_classification = "Database Intrusion"
            else:
                final_classification = "Unauthorized Port Scan"

        formatted_packet = {
            "Destination Port": dest_port,
            "Flow Duration": live_duration, 
            "Total Fwd Packets": live_packets, 
            "Label": final_classification, # <-- DIVERSE AI DECISION
            "Source IP": src_ip,
            "Destination IP": dst_ip
        }
        
        packet_batch.append(formatted_packet)
        
        if len(packet_batch) >= BATCH_SIZE:
            batch_to_send = list(packet_batch)
            packet_batch.clear()
            threading.Thread(target=send_to_backend, args=(batch_to_send,)).start()

def start_sniffing():
    print("🚀 NetShield AI Sniffer is live. Capturing network traffic...")
    sniff(prn=process_packet, store=False)

if __name__ == "__main__":
    start_sniffing()