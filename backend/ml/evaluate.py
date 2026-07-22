import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# -------------------------
# Load Model
# -------------------------

model = joblib.load("ml/models/threat_classifier.pkl")
encoder = joblib.load("ml/models/attack_encoder.pkl")

# -------------------------
# Load Test Dataset
# -------------------------

test = pd.read_csv("ml/models/test_processed.csv")

X = test.drop(columns=["id", "label", "attack_cat"])
y = encoder.transform(test["attack_cat"])

# -------------------------
# Predict
# -------------------------

pred = model.predict(X)

# -------------------------
# Accuracy
# -------------------------

accuracy = accuracy_score(y, pred)

print("=" * 50)
print("MODEL EVALUATION")
print("=" * 50)
print(f"Accuracy : {accuracy*100:.2f}%")
print()

print("Classification Report")
print(classification_report(y, pred))

# -------------------------
# Create Reports Folder
# -------------------------

os.makedirs("reports", exist_ok=True)

# -------------------------
# Save Classification Report
# -------------------------

report = pd.DataFrame(
    classification_report(
        y,
        pred,
        output_dict=True
    )
).transpose()

report.to_csv("reports/classification_report.csv")

print("classification_report.csv saved")

# -------------------------
# Save Confusion Matrix
# -------------------------

cm = confusion_matrix(y, pred)

plt.figure(figsize=(8,6))
plt.imshow(cm, cmap="Blues")
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.colorbar()

plt.savefig("reports/confusion_matrix.png")

print("confusion_matrix.png saved")