import pandas as pd
import numpy as np
import random
from mongo_db import flows_collection
import os

def load_real_traffic_to_dashboard():
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'ml_engine', 'data', 'Wednesday-workingHours.pcap_ISCX.csv')
    
    print(f"Loading original CICIDS data for dashboard...")
    df = pd.read_csv(data_path)
    
    # Clean spaces and infinities
    df.columns = df.columns.str.strip()
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)
    
    # Take a RANDOM sample of 500 rows so we get DDoS attacks too!
    df = df.sample(n=500, random_state=42)
    
    # --- SMART COLUMN FINDER ---
    def find_col(keyword1, keyword2=None):
        for col in df.columns:
            col_lower = col.lower()
            if keyword1.lower() in col_lower:
                if keyword2 is None or keyword2.lower() in col_lower:
                    return col
        return None

    src_ip_col = find_col('source', 'ip') or find_col('src', 'ip')
    dst_ip_col = find_col('destination', 'ip') or find_col('dst', 'ip')
    dst_port_col = find_col('destination', 'port') or find_col('dst', 'port')
    protocol_col = find_col('protocol')
    duration_col = find_col('flow', 'duration')
    packets_col = find_col('total', 'fwd')
    bytes_col = find_col('bytes')
    label_col = find_col('label')

    # Generate realistic IPs if the CSV didn't have them
    internal_ips = ["192.168.1.10", "10.0.0.15", "172.16.0.3"]
    external_ips = ["203.0.113.5", "185.220.101.34", "45.33.32.156", "198.51.100.12"]

    mapped_df = pd.DataFrame({
        'src_ip': df[src_ip_col] if src_ip_col else [random.choice(external_ips + internal_ips) for _ in range(500)],
        'dst_ip': df[dst_ip_col] if dst_ip_col else [random.choice(internal_ips) for _ in range(500)],
        'dst_port': df[dst_port_col] if dst_port_col else [random.choice([80, 443, 22, 3389]) for _ in range(500)],
        'protocol': df[protocol_col] if protocol_col else 'TCP',
        'flow_duration': df[duration_col] if duration_col else 0,
        'total_fwd_packets': df[packets_col] if packets_col else 0,
        'total_bytes': df[bytes_col] if bytes_col else 0, 
        'label': df[label_col] if label_col else 'Unknown',
        'timestamp': pd.Timestamp.now()
    })
    
    # Simplify the label
    def map_label(label):
        label = str(label).strip().lower()
        if 'benign' in label: return 'BENIGN'
        elif 'ddos' in label or 'dos' in label: return 'DDoS'
        elif 'portscan' in label: return 'PortScan'
        else: return 'Other Attack'
        
    mapped_df['label'] = mapped_df['label'].apply(map_label)
    
    records = mapped_df.to_dict('records')
    
    # Clear old data and insert new
    flows_collection.delete_many({})
    flows_collection.insert_many(records)
    
    # Print distribution so we can verify we got attacks!
    print(f"Label Distribution Injected:\n{mapped_df['label'].value_counts()}")
    print(f"✅ Successfully injected {len(records)} REAL CICIDS flows into MongoDB!")

if __name__ == "__main__":
    load_real_traffic_to_dashboard()