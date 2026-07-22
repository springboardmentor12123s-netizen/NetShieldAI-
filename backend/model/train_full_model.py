# import os
# import glob
# import time
# import pandas as pd
# import numpy as np
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.model_selection import train_test_split
# from sklearn.metrics import classification_report
# import joblib

# def main():
#     print("🌍 INITIALIZING GLOBAL OMNI-TRAINING SEQUENCE...\n")
    
#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     data_dir = os.path.join(script_dir, "data", "processed", "cic")
    
#     # Find ALL processed CSV files in the folder
#     all_files = glob.glob(os.path.join(data_dir, "processed_*.csv"))
    
#     if not all_files:
#         print(f"❌ ERROR: No processed CSV files found in {data_dir}")
#         return

#     print(f"📂 Found {len(all_files)} datasets. Beginning extraction...")
    
#     dataframes = []
    
#     for file in all_files:
#         filename = os.path.basename(file)
#         print(f"   -> Slicing 10% from {filename}...")
        
#         try:
#             # Read the file
#             df = pd.read_csv(file)
#             df.columns = df.columns.str.strip()
            
#             # Take a 10% random sample to protect the 16GB RAM limit
#             df_sample = df.sample(frac=0.10, random_state=42)
#             dataframes.append(df_sample)
#         except Exception as e:
#             print(f"   [!] Failed to load {filename}: {e}")

#     # Stitch them all into one massive dataset
#     print("\n🧵 Stitching datasets together into a master matrix...")
#     master_dataset = pd.concat(dataframes, ignore_index=True)
    
#     print(f"📊 Total Master Dataset Size: {len(master_dataset):,} packets")

#     # ==========================================
#     # DATA PREPARATION
#     # ==========================================
#     # We are keeping MULTI-CLASS labels so your dashboard tells you exactly what kind of attack it is!
#     X = master_dataset[[
#         'Destination Port', 'Flow Duration', 'Total Fwd Packets',
#         'Total Length of Fwd Packets', 'Flow IAT Mean', 'Bwd Packet Length Mean'
#     ]]
#     y = master_dataset['Label']

#     # Clean up any weird dataset math errors
#     X = X.replace([np.inf, -np.inf], np.nan).fillna(0)

#     # Split for final testing
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

#     # ==========================================
#     # FINAL MODEL TRAINING
#     # ==========================================
#     print("\n🧠 Forging the Final Omni-Model using optimized parameters...")
#     print("   (Parameters: max_depth=10, n_estimators=50, min_samples_split=2)")
    
#     start_time = time.time()
    
#     # We are injecting the exact settings your Grid Search discovered!
#     final_model = RandomForestClassifier(
#         n_estimators=50, 
#         max_depth=15, 
#         min_samples_split=2,
#         n_jobs=-1, # Use all CPU cores on your RTX/Intel rig
#         random_state=42
#     )
    
#     final_model.fit(X_train, y_train)
#     elapsed_time = time.time() - start_time
    
#     print(f"✅ Master Training Complete in {elapsed_time:.2f} seconds!")

#     # ==========================================
#     # FINAL EVALUATION & EXPORT
#     # ==========================================
#     print("\n🔬 TESTING AGAINST ALL THREAT VECTORS:")
#     y_pred = final_model.predict(X_test)
#     print(classification_report(y_test, y_pred, zero_division=0))

#     model_path = os.path.join(script_dir, "netshield_model.pkl")
#     joblib.dump(final_model, model_path)
#     print(f"\n🚀 PRODUCTION MODEL SAVED TO: {model_path}")
#     print("NetShield AI is fully armed for multi-vector threat detection.")

# if __name__ == "__main__":
#     main()