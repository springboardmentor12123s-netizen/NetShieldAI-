import os
import joblib
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)

warnings.filterwarnings("ignore")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "..",
    "..",
    "..",
    "datasets",
    "CICIDS2017",
    "clean_dataset.csv",
)

MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "feature_columns.pkl")

CONFUSION_MATRIX_PATH = os.path.join(BASE_DIR, "confusion_matrix.png")
FEATURE_IMPORTANCE_PATH = os.path.join(BASE_DIR, "feature_importance.png")



print("=" * 60)
print("Loading dataset...")
print("=" * 60)

df = pd.read_csv(DATASET_PATH)

print(f"Dataset Shape : {df.shape}")



before = len(df)
df = df.drop_duplicates()
after = len(df)

print(f"Removed {before-after} duplicate rows")


df.replace([np.inf, -np.inf], np.nan, inplace=True)

df.dropna(inplace=True)

print(f"Dataset Shape after cleaning : {df.shape}")


MAX_ROWS = 200000

if len(df) > MAX_ROWS:

    print(f"\nSampling {MAX_ROWS:,} rows from dataset...")

    df = df.sample(
        n=MAX_ROWS,
        random_state=42,
    )

print(f"Training Dataset Shape : {df.shape}")


X = df.drop("Label", axis=1)

y = df["Label"]

feature_columns = X.columns.tolist()


counts = y.value_counts()

valid_classes = counts[counts >= 10].index

df = df[df["Label"].isin(valid_classes)]

# ==========================================================
# FEATURES USED FOR TRAINING
# ==========================================================

FEATURES = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
]

X = df[FEATURES]

y = df["Label"]

feature_columns = FEATURES


encoder = LabelEncoder()

y = encoder.fit_transform(y)

print("\nAttack Classes:\n")

for i, label in enumerate(encoder.classes_):
    print(f"{i} -> {label}")
    

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print("\nTrain Size :", X_train.shape)
print("Test Size  :", X_test.shape)


print("\nTraining Random Forest Model...\n")

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)

print("\nModel Training Completed Successfully!\n")


predictions = model.predict(X_test)


accuracy = accuracy_score(y_test, predictions)
precision = precision_score(
    y_test,
    predictions,
    average="weighted",
    zero_division=0,
)
recall = recall_score(
    y_test,
    predictions,
    average="weighted",
    zero_division=0,
)
f1 = f1_score(
    y_test,
    predictions,
    average="weighted",
    zero_division=0,
)

print("=" * 60)
print("MODEL PERFORMANCE")
print("=" * 60)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nClassification Report\n")
print(
    classification_report(
        y_test,
        predictions,
        target_names=encoder.classes_,
        zero_division=0,
    )
)


print("\nGenerating Confusion Matrix...")

cm = confusion_matrix(y_test, predictions)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
)

fig, ax = plt.subplots(figsize=(12, 12))
disp.plot(
    ax=ax,
    xticks_rotation=90,
    colorbar=False,
)

plt.title("Confusion Matrix")
plt.tight_layout()
plt.savefig(CONFUSION_MATRIX_PATH)
plt.close()

print("Saved:", CONFUSION_MATRIX_PATH)


print("\nGenerating Feature Importance Graph...")

importance = pd.DataFrame({
    "Feature": feature_columns,
    "Importance": model.feature_importances_,
})

importance = importance.sort_values(
    by="Importance",
    ascending=False,
)

top20 = importance.head(20)

plt.figure(figsize=(10, 8))
plt.barh(top20["Feature"], top20["Importance"])
plt.gca().invert_yaxis()
plt.title("Top 20 Important Features")
plt.tight_layout()
plt.savefig(FEATURE_IMPORTANCE_PATH)
plt.close()

print("Saved:", FEATURE_IMPORTANCE_PATH)


print("\nSaving Model...")

joblib.dump(model, MODEL_PATH)
joblib.dump(encoder, ENCODER_PATH)
joblib.dump(feature_columns, FEATURES_PATH)

print("Saved:", MODEL_PATH)
print("Saved:", ENCODER_PATH)
print("Saved:", FEATURES_PATH)


print("\n" + "=" * 60)
print("MILESTONE 2 - MODEL TRAINING COMPLETED SUCCESSFULLY")
print("=" * 60)