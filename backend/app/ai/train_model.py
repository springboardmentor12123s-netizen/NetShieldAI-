import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

print("=" * 50)
print("NETSHIELD AI - MODEL TRAINING")
print("=" * 50)

# -------------------------
# Load Dataset
# -------------------------

import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "CICIDS2017",
    "clean_dataset.csv"
)
print("\nLoading cleaned dataset...")

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully.")
print("Dataset Shape:", df.shape)

# -------------------------
# Keep only database columns
# -------------------------

FEATURE_COLUMNS = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s"
]

X = df[FEATURE_COLUMNS].copy()

# Replace infinite values
X.replace([float("inf"), float("-inf")], 0, inplace=True)
X.fillna(0, inplace=True)

y = df["Label"]

# -------------------------
# Encode labels
# -------------------------

encoder = LabelEncoder()
y = encoder.fit_transform(y)

# -------------------------
# Split dataset
# -------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nReducing training size for faster training...")

sample = X_train.copy()
sample["label"] = y_train

sample = sample.sample(
    n=200000,
    random_state=42
)

y_train = sample["label"]
X_train = sample.drop(columns=["label"])

print("Training Samples:", len(X_train))

# -------------------------
# Train Model
# -------------------------

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1
)

print("\nTraining Model...")

model.fit(X_train, y_train)

print("Training Completed!")

# -------------------------
# Evaluate
# -------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nAccuracy:", accuracy)

print("\nClassification Report\n")

print(classification_report(y_test, predictions))

# -------------------------
# Save Model
# -------------------------

os.makedirs("app/ai", exist_ok=True)

joblib.dump(model, "app/ai/model.pkl")
joblib.dump(encoder, "app/ai/label_encoder.pkl")

print("\nModel Saved Successfully!")
print("Location: app/ai/model.pkl")