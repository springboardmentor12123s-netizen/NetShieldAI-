import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report
import joblib

def train_ai_models():
    print("Loading dataset...")
    # Load the data we just generated
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'cleaned_Wednesday-workingHours.pcap_ISCX.csv')
    df = pd.read_csv(data_path)

    # --- DATA PREPROCESSING ---
    print("Preprocessing data...")
    X = df.drop('Label', axis=1) # Features (everything except the label)
    y = df['Label']              # Target (The attack type)

    # Encode labels (Converts "BENIGN", "DDoS" etc. to 0, 1, 2, 3 for the ML model)
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    # Scale features (Normalizes the numbers so huge values like 1000000 don't overpower small values like 5)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split into training and testing datasets (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42)

    # --- MODEL 1: ANOMALY DETECTION (Isolation Forest) ---
    print("Training Anomaly Detection Model (Isolation Forest)...")
    # We set contamination=0.2 because we know ~20% of our data is attacks
    iso_forest = IsolationForest(contamination=0.2, random_state=42)
    iso_forest.fit(X_train) # Notice we only fit X_train, not y_train (Unsupervised!)

    # --- MODEL 2: THREAT CLASSIFICATION (Random Forest) ---
    print("Training Threat Classification Model (Random Forest)...")
    rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_classifier.fit(X_train, y_train) # Fits both features and labels (Supervised!)

    # --- EVALUATE MODELS ---
    print("\n--- Evaluating Classification Model ---")
    y_pred = rf_classifier.predict(X_test)
    # Convert encoded numbers back to text labels for the report
    target_names = label_encoder.inverse_transform(sorted(np.unique(y_encoded)))
    print(classification_report(y_test, y_pred, target_names=target_names))

    # --- SAVE MODELS & PREPROCESSORS ---
    models_path = os.path.join(os.path.dirname(__file__), 'models')
    
    joblib.dump(iso_forest, os.path.join(models_path, 'anomaly_detector.pkl'))
    joblib.dump(rf_classifier, os.path.join(models_path, 'threat_classifier.pkl'))
    joblib.dump(scaler, os.path.join(models_path, 'scaler.pkl'))
    joblib.dump(label_encoder, os.path.join(models_path, 'label_encoder.pkl'))

    print("\n✅ AI Models trained and saved successfully to the 'models' folder!")

if __name__ == "__main__":
    train_ai_models()