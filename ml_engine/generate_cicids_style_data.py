import pandas as pd
import numpy as np
import random
import os

def generate_cicids_style_data(num_samples=10000):
    """Generates a dataset mimicking CICIDS2017 features for ML training."""
    data = []

    for _ in range(num_samples):
        # Base features (Normal Traffic Behavior)
        flow_duration = random.randint(50, 10000)
        total_fwd_packets = random.randint(1, 20)
        total_backward_packets = random.randint(1, 20)
        fwd_packet_length_max = random.randint(20, 1500)
        fwd_packet_length_mean = random.uniform(20, fwd_packet_length_max)
        flow_bytes_per_sec = random.uniform(50, 50000)
        flow_packets_per_sec = random.uniform(1, 100)
        
        label = "BENIGN"

        # Introduce Anomalies (Attack Traffic - ~20% of data)
        is_attack = random.random() < 0.20
        if is_attack:
            attack_type = random.choice(["DDoS", "PortScan", "BruteForce"])
            
            if attack_type == "DDoS":
                # DDoS: Massive amounts of packets, short duration, high bytes/sec
                total_fwd_packets = random.randint(500, 5000)
                total_backward_packets = random.randint(0, 5) # Asymmetric
                flow_duration = random.randint(10, 500)
                fwd_packet_length_max = random.randint(500, 1500)
                flow_bytes_per_sec = random.uniform(100000, 1000000)
                flow_packets_per_sec = random.uniform(500, 5000)
                label = "DDoS"
                
            elif attack_type == "PortScan":
                # PortScan: Very small packets, high packet rate, extremely short duration
                total_fwd_packets = random.randint(1, 5)
                total_backward_packets = 0
                flow_duration = random.randint(1, 50)
                fwd_packet_length_max = random.randint(1, 10)
                flow_bytes_per_sec = random.uniform(10, 100)
                flow_packets_per_sec = random.uniform(100, 1000)
                label = "PortScan"
                
            elif attack_type == "BruteForce":
                # BruteForce: Repetitive medium packets, consistent rate
                total_fwd_packets = random.randint(20, 100)
                total_backward_packets = random.randint(20, 100)
                fwd_packet_length_max = random.randint(100, 300)
                flow_packets_per_sec = random.uniform(10, 50)
                label = "BruteForce"

        data.append([
            flow_duration, 
            total_fwd_packets, 
            total_backward_packets, 
            fwd_packet_length_max, 
            round(fwd_packet_length_mean, 2),
            round(flow_bytes_per_sec, 2), 
            round(flow_packets_per_sec, 2),
            label
        ])

    # Create DataFrame with CICIDS-style column names
    columns = [
        ' Flow Duration', ' Total Fwd Packets', ' Total Backward Packets',
        ' Fwd Packet Length Max', ' Fwd Packet Length Mean',
        'Flow Bytes/s', ' Flow Packets/s', ' Label'
    ]
    
    df = pd.DataFrame(data, columns=columns)
    
    # Shuffle the dataset so attacks aren't all at the end
    df = df.sample(frac=1).reset_index(drop=True)
    
    # Save to the data folder
    save_path = os.path.join(os.path.dirname(__file__), 'data', 'network_traffic.csv')
    df.to_csv(save_path, index=False)
    print(f"Successfully generated {num_samples} samples and saved to {save_path}")

if __name__ == "__main__":
 generate_cicids_style_data()