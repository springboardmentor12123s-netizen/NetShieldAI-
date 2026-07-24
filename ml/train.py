import os
import joblib
import pandas as pd

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

print("=" * 50)
print("Network Intrusion Detection Model Training")
print("=" * 50)

# ==========================================
# Load Dataset
# ==========================================

dataset = "cleaned_dataset.csv"

df = pd.read_csv(dataset)

print("\nDataset Loaded Successfully")
print("Rows :", df.shape[0])
print("Columns :", df.shape[1])

# ==========================================
# Features and Target
# ==========================================

x = df.drop("Label", axis=1)
y = df["Label"]

print("\nFeatures :", x.shape[1])
print("Classes :", y.nunique())

# ==========================================
# Encode Labels
# ==========================================

encoder = LabelEncoder()

y = encoder.fit_transform(y)

print("\nAttack Classes\n")

for i, c in enumerate(encoder.classes_):
    print(i, "->", c)

# ==========================================
# Train Test Split
# ==========================================

x_train, x_test, y_train, y_test = train_test_split(
    x,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

print("\nTraining Samples :", len(x_train))
print("Testing Samples :", len(x_test))

# ==========================================
# Train Model
# ==========================================

print("\nTraining Random Forest...\n")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
)

model.fit(x_train, y_train)

print("Training Completed.")

# ==========================================
# Prediction
# ==========================================

y_pred = model.predict(x_test)

# ==========================================
# Accuracy
# ==========================================

acc = accuracy_score(y_test, y_pred)

print("\nAccuracy")

print(round(acc * 100, 2), "%")

# ==========================================
# Classification Report
# ==========================================

print("\nClassification Report\n")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=encoder.classes_,
    )
)

# ==========================================
# Confusion Matrix
# ==========================================

cm = confusion_matrix(y_test, y_pred)

print("\nConfusion Matrix\n")

print(cm)

# ==========================================
# Create Models Folder
# ==========================================

model_folder = "models"

# If a file named "models" exists, remove it
if os.path.exists(model_folder) and not os.path.isdir(model_folder):
    os.remove(model_folder)

# Create folder if it doesn't exist
os.makedirs(model_folder, exist_ok=True)

# ==========================================
# Save Model
# ==========================================

joblib.dump(
    model,
    os.path.join(model_folder, "model.pkl")
)

joblib.dump(
    encoder,
    os.path.join(model_folder, "label_encoder.pkl")
)

joblib.dump(
    list(x.columns),
    os.path.join(model_folder, "feature_names.pkl")
)

print("\nModel Saved Successfully")

print("Model       :", os.path.join(model_folder, "model.pkl"))
print("Encoder     :", os.path.join(model_folder, "label_encoder.pkl"))
print("Features    :", os.path.join(model_folder, "feature_names.pkl"))

print("\nTraining Process Completed Successfully.")