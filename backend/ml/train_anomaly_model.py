import os
import joblib
import pandas as pd

from sklearn.ensemble import IsolationForest

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

train_path = os.path.join(BASE_DIR, "ml", "models", "train_processed.csv")

df = pd.read_csv(train_path)

X = df.drop(columns=["id", "attack_cat", "label"])

print("Training Isolation Forest...")

model = IsolationForest(
    contamination=0.1,
    random_state=42,
    n_estimators=100
)

model.fit(X)

os.makedirs("ml/models", exist_ok=True)

joblib.dump(model, "ml/models/isolation_forest.pkl")

print("✅ Isolation Forest Model Saved Successfully")