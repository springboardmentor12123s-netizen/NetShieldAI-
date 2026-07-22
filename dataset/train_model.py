import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib

# Step 1: Load the dataset
print("Loading dataset...")
df = pd.read_csv("cicids2017_cleaned.csv")

# Step 2: Take a smaller sample to train faster while learning
# (100,000 rows is plenty to get a working model; we can scale up later)
df = df.sample(n=100000, random_state=42)

# Step 3: Handle any missing or broken values
df = df.replace([float("inf"), float("-inf")], pd.NA)
df = df.dropna()

# Step 4: Separate features (X) from the label (y)
X = df.drop("Attack Type", axis=1)
y = df["Attack Type"]

# Step 5: Convert text labels into numbers (e.g. Normal Traffic -> 0, DoS -> 1, ...)
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print("Label mapping:")
for i, label in enumerate(label_encoder.classes_):
    print(f"  {i} -> {label}")

# Step 6: Split into training data (80%) and testing data (20%)
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# Step 7: Train the model
print("\nTraining model... this may take a minute or two.")
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# Step 8: Test how well it learned
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"\nAccuracy: {accuracy:.4f}")
print("\nDetailed report:")
print(classification_report(y_test, predictions, target_names=label_encoder.classes_))

# Step 9: Save the trained model so we can reuse it later without retraining
joblib.dump(model, "../models/anomaly_model.pkl")
joblib.dump(label_encoder, "../models/label_encoder.pkl")
print("\nModel saved successfully to the models folder!")

# Step 10: Save evaluation report to a file
report_text = classification_report(y_test, predictions, target_names=label_encoder.classes_)

with open("../models/evaluation_report.txt", "w") as f:
    f.write("NetShield AI - Anomaly Detection Model Evaluation Report\n")
    f.write("=" * 55 + "\n\n")
    f.write(f"Overall Accuracy: {accuracy:.4f}\n\n")
    f.write("Detailed Classification Report:\n")
    f.write(report_text)

print("\nEvaluation report saved to models/evaluation_report.txt")