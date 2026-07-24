import pandas as pd
import numpy as np
import os

def preprocess_and_load(csv_filename):
    data_path = os.path.join(os.path.dirname(__file__), 'data', csv_filename)
    
    print(f"Loading raw dataset: {csv_filename}...")
    
    # Load the CSV (This might take a minute as the real file is huge)
    df = pd.read_csv(data_path)
    
    print(f"Original shape: {df.shape}")

    # --- DATA CLEANING STEPS ---
    
    # 1. Strip whitespace from column names (CICIDS2017 is notorious for ' Label' instead of 'Label')
    df.columns = df.columns.str.strip()
    
    # 2. Replace Infinity values with NaN, then drop NaNs
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    # 3. Drop rows with missing values
    initial_rows = df.shape[0]
    df.dropna(inplace=True)
    print(f"Dropped {initial_rows - df.shape[0]} rows with missing/infinite values.")
    
    # 4. Ensure we only keep the features our model cares about
    features_to_keep = [
        'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets',
        'Fwd Packet Length Max', 'Fwd Packet Length Mean',
        'Flow Bytes/s', 'Flow Packets/s', 'Label'
    ]
    
    # Filter the dataframe to only these columns (ignore case just in case)
    df.columns = df.columns.str.capitalize()
    features_capitalized = [f.capitalize() for f in features_to_keep]
    
    # Check which columns actually exist in the CSV
    existing_cols = [col for col in features_capitalized if col in df.columns]
    df = df[existing_cols]
    
    # 5. Standardize the Label column (The real dataset has specific names like 'DoS hulk')
    def map_label(label):
        label = str(label).strip().lower()
        if label == 'benign':
            return 'BENIGN'
        elif 'ddos' in label or 'dos' in label:
            return 'DDoS'
        elif 'portscan' in label:
            return 'PortScan'
        elif 'bruteforce' in label or 'ftp' in label or 'ssh' in label:
            return 'BruteForce'
        else:
            return 'Other Attack' # Group web attacks, infiltration, etc.
            
    df['Label'] = df['Label'].apply(map_label)
    
    # Save the cleaned dataset
    cleaned_filename = f"cleaned_{csv_filename}"
    save_path = os.path.join(os.path.dirname(__file__), 'data', cleaned_filename)
    df.to_csv(save_path, index=False)
    
    print(f"✅ Cleaned data saved to {save_path}")
    print(f"Final shape: {df.shape}")
    print(f"Label Distribution:\n{df['Label'].value_counts()}\n")

if __name__ == "__main__":
    # Change this to the exact name of the Wednesday file!
    target_file = "Wednesday-workingHours.pcap_ISCX.csv"
    preprocess_and_load(target_file)