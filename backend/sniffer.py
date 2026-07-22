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
        print(f"✅ Sent {len(batch_to_send)} packets to backend.")
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
        
        # --- THE FIX: Align columns dynamically ---
        # Get the exact list of feature names the model was trained on
        expected_features = ml_model.feature_names_in_
        
        # Inject missing columns as 0 so the model doesn't panic
        for col in expected_features:
            if col not in features.columns:
                features[col] = 0
                
        # Reorder columns to perfectly match the training data shape
        features = features[expected_features]
        # ----------------------------------------
        # Temporary test override to simulate an attack batch
        # prediction = random.choice(["BENIGN", "BENIGN", "DDoS Attack", "PortScan"])
        # 2. Ask the Random Forest to predict the threat level based on the live data!
        prediction = ml_model.predict(features)[0]
        
        formatted_packet = {
            "Destination Port": dest_port,
            "Flow Duration": live_duration, 
            "Total Fwd Packets": live_packets, 
            "Label": prediction, # <-- THE AI'S DECISION
            "Source IP": src_ip,
            "Destination IP": dst_ip
        }
        
        packet_batch.append(formatted_packet)
        
        if len(packet_batch) >= BATCH_SIZE:
            batch_to_send = list(packet_batch)
            packet_batch.clear()
            threading.Thread(target=send_to_backend, args=(batch_to_send,)).start()

def start_sniffing():
    print("🚀 NetShield AI Sniffer is live.")
    sniff(prn=process_packet, store=False)

if __name__ == "__main__":
    start_sniffing()