import os
import time
import requests
import pandas as pd
import joblib
import glob
import random

print("🚀 Initializing NetShield Omni-Replayer...")

API_URL = "http://127.0.0.1:8000/api/live-traffic"
BATCH_SIZE = 5

# 1. Load the Omni-Model
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "netshield_model.pkl")
print("🧠 Loading Multi-Vector AI Model...")
ml_model = joblib.load(model_path)

# 2. Load the Arsenal (All Processed Datasets)
data_dir = os.path.join(script_dir, "data", "processed", "cic")
all_files = glob.glob(os.path.join(data_dir, "processed_*.csv"))

if not all_files:
    print("❌ ERROR: No processed data found!")
    exit()

print(f"📂 Found {len(all_files)} threat datasets. Chambering rounds...")

# Extract a quick sample of 500 packets from every single file to create a chaotic test mix
dataframes = []
for f in all_files:
    try:
        df = pd.read_csv(f)
        # Take up to 500 packets per file
        sample_size = min(500, len(df))
        df_sample = df.sample(n=sample_size, random_state=42)
        dataframes.append(df_sample)
    except Exception as e:
        pass

# Stitch them together and shuffle them completely
dataset = pd.concat(dataframes, ignore_index=True)
dataset = dataset.sample(frac=1, random_state=42).reset_index(drop=True)

print("🔥 FIRING MULTI-VECTOR PACKETS AT BACKEND...")
packet_batch = []

for index, row in dataset.iterrows():
    dest_port = row.get('Destination Port', 80)
    duration = row.get('Flow Duration', 0)
    packets = row.get('Total Fwd Packets', 1)
    
    # We grab the actual label just to print it in the terminal for your reference
    actual_label = row.get('Label', 'Unknown')
    
    # AI INFERENCE IN REAL TIME
    features = pd.DataFrame(
        [[dest_port, duration, packets]], 
        columns=['Destination Port', 'Flow Duration', 'Total Fwd Packets']
    )
    prediction = ml_model.predict(features)[0]
    
    # Format payload for the Next.js dashboard
    formatted_packet = {
        "Destination Port": int(dest_port),
        "Flow Duration": int(duration),
        "Total Fwd Packets": int(packets),
        "Label": prediction, 
        "Source IP": f"Ext_{random.randint(10, 250)}",
        "Destination IP": "NetShield_Core"
    }
    
    packet_batch.append(formatted_packet)
    
    if len(packet_batch) >= BATCH_SIZE:
        try:
            requests.post(API_URL, json=packet_batch)
            print(f"📡 Sent Batch | AI Verdict: [{prediction}] | (Actual Truth: {actual_label})")
        except Exception as e:
            print(f"❌ Connection to Backend lost: {e}")
        
        packet_batch.clear()
        time.sleep(0.5) # Half-second delay so the dashboard animates smoothly