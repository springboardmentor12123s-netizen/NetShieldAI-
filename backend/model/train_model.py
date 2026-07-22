# import pandas as pd
# import numpy as np
# from sklearn.ensemble import RandomForestClassifier
# import joblib

# print("🧠 Initializing NetShield ML Training Sequence...")

# # 1. Generate Synthetic Training Data
# # Features: [Destination Port, Flow Duration, Total Fwd Packets]
# np.random.seed(42)

# # NORMAL TRAFFIC (Ports 80/443, normal durations, small packet counts)
# normal_data = pd.DataFrame({
#     'port': np.random.choice([80, 443], 500),
#     'duration': np.random.randint(100, 1500, 500),
#     'packets': np.random.randint(1, 15, 500),
#     'label': 'BENIGN'
# })

# # ATTACK TRAFFIC (Random weird ports, massive durations, huge packet counts)
# attack_data = pd.DataFrame({
#     'port': np.random.randint(1024, 65535, 500),
#     'duration': np.random.randint(5000, 20000, 500),
#     'packets': np.random.randint(500, 5000, 500),
#     'label': 'DDoS'
# })

# # Combine and shuffle
# dataset = pd.concat([normal_data, attack_data]).sample(frac=1).reset_index(drop=True)

# # 2. Split Features (X) and Labels (y)
# X = dataset[['port', 'duration', 'packets']]
# y = dataset['label']

# # 3. Train the Random Forest
# print("🌲 Training Random Forest Classifier...")
# model = RandomForestClassifier(n_estimators=50, random_state=42)
# model.fit(X, y)

# # 4. Save the Model to Disk
# model_path = "backend/netshield_model.pkl"
# joblib.dump(model, model_path)

# print(f"✅ Training Complete! Model saved to {model_path}.")
# print(f"Accuracy on training data: {model.score(X, y) * 100:.2f}%")