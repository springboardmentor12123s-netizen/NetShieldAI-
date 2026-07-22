# import os
# import glob
# import pandas as pd
# import numpy as np

# def preprocess_all_datasets():
#     print("⚙️ INITIALIZING DPI-ENABLED OMNI-PARSER...\n")
    
#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     raw_dir = os.path.join(script_dir, "data", "raw")
#     output_dir = os.path.join(script_dir, "data", "processed", "cic")
#     os.makedirs(output_dir, exist_ok=True)
    
#     raw_files = glob.glob(os.path.join(raw_dir, "**", "*.csv"), recursive=True)
#     print(f"📂 Found {len(raw_files)} total CSV files. Scanning...\n")

#     # 🔥 NEW DPI FEATURES ADDED 🔥
#     required_features = [
#         'Destination Port', 'Flow Duration', 'Total Fwd Packets', 
#         'Total Length of Fwd Packets', 'Flow IAT Mean', 'Bwd Packet Length Mean'
#     ]
#     required_cols = required_features + ['Label']

#     for file_path in raw_files:
#         filename = os.path.basename(file_path)
        
#         if filename.startswith("processed_") or "features" in filename.lower() or "list_events" in filename.lower():
#             continue
            
#         if filename in ["UNSW-NB15_1.csv", "UNSW-NB15_2.csv", "UNSW-NB15_3.csv", "UNSW-NB15_4.csv"]:
#             continue

#         print(f"🔄 Processing: {filename}...")
        
#         try:
#             df = pd.read_csv(file_path, low_memory=False)
#             df.columns = df.columns.str.strip()
            
#             # ==========================================
#             # UNSW TRANSLATOR (Now with Deep Features)
#             # ==========================================
#             if "UNSW" in filename.upper():
#                 if 'attack_cat' in df.columns:
#                     df['Label'] = df['attack_cat'].fillna('BENIGN').replace('Normal', 'BENIGN')
#                 else:
#                     df['Label'] = 'BENIGN'
                    
#                 if 'dur' in df.columns: df['Flow Duration'] = df['dur'] * 1_000_000
#                 if 'spkts' in df.columns: df['Total Fwd Packets'] = df['spkts']
                
#                 # New DPI Mappings
#                 if 'sbytes' in df.columns: df['Total Length of Fwd Packets'] = df['sbytes']
#                 if 'dmean' in df.columns: df['Bwd Packet Length Mean'] = df['dmean']
#                 # UNSW sinpkt is in ms, CICIDS is in microseconds. Multiply by 1000.
#                 if 'sinpkt' in df.columns: df['Flow IAT Mean'] = df['sinpkt'] * 1000 
                
#                 if 'dsport' in df.columns:
#                     df['Destination Port'] = pd.to_numeric(df['dsport'], errors='coerce').fillna(0)
#                 elif 'service' in df.columns:
#                     port_map = {
#                         'http': 80, 'ftp': 21, 'ftp-data': 20, 'ssh': 22, 
#                         'dns': 53, 'smtp': 25, 'pop3': 110, 'ssl': 443, 
#                         'snmp': 161, 'radius': 1812, 'irc': 6667, '-': 0
#                     }
#                     df['Destination Port'] = df['service'].str.lower().map(port_map).fillna(0)
#                 else:
#                     df['Destination Port'] = 0
#             # ==========================================

#             missing_cols = [col for col in required_cols if col not in df.columns]
#             if missing_cols:
#                 print(f"   ⚠️ Skipping {filename}: Missing columns {missing_cols}")
#                 continue
                
#             cleaned_df = df[required_cols].copy()
#             for feature in required_features:
#                 cleaned_df[feature] = pd.to_numeric(cleaned_df[feature], errors='coerce')
                
#             cleaned_df = cleaned_df.replace([np.inf, -np.inf], np.nan).dropna()
            
#             output_filename = f"processed_{filename}"
#             destination_path = os.path.join(output_dir, output_filename)
#             cleaned_df.to_csv(destination_path, index=False)
            
#             print(f"   💾 Saved clean matrix ({len(cleaned_df):,} packets) -> {output_filename}\n")
            
#         except Exception as e:
#             print(f"   ❌ Failed to process {filename}: {str(e)}\n")

# if __name__ == "__main__":
#     preprocess_all_datasets()