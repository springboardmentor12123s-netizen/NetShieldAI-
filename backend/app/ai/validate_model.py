import os
import time
import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


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

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model.pkl",
)

ENCODER_PATH = os.path.join(
    BASE_DIR,
    "label_encoder.pkl",
)

FEATURES_PATH = os.path.join(
    BASE_DIR,
    "feature_columns.pkl",
)

REPORT_PATH = os.path.join(
    BASE_DIR,
    "model_validation_report.txt",
)

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

print("=" * 70)
print("        NETSHIELD AI - MODEL VALIDATION")
print("=" * 70)

print("\nLoading trained model...")

model = joblib.load(MODEL_PATH)
encoder = joblib.load(ENCODER_PATH)
feature_columns = joblib.load(FEATURES_PATH)

print("Model loaded successfully.")
print("Model type:", type(model).__name__)


print("\nLoading dataset...")

df = pd.read_csv(DATASET_PATH)

print("Original dataset shape:", df.shape)

df.replace(
    [np.inf, -np.inf],
    np.nan,
    inplace=True,
)

df.dropna(inplace=True)

print("Dataset shape after cleaning:", df.shape)

X = df[FEATURES]

y = df["Label"]

known_classes = set(encoder.classes_)

unknown_classes = sorted(
    set(y.unique()) - known_classes
)

if unknown_classes:

    print("\nClasses not present in the saved model:")

    for label in unknown_classes:
        print(" -", label)

    print(
        f"\nRemoving {len(unknown_classes)} unknown class(es) "
        "from validation data..."
    )

    valid_mask = y.isin(known_classes)

    X = X.loc[valid_mask]
    y = y.loc[valid_mask]

y_encoded = encoder.transform(y)

MAX_VALIDATION_ROWS = 50000

if len(X) > MAX_VALIDATION_ROWS:

    print(
        f"\nUsing {MAX_VALIDATION_ROWS:,} samples for validation..."
    )

    validation_indices = np.random.RandomState(42).choice(
        len(X),
        MAX_VALIDATION_ROWS,
        replace=False,
    )

    X = X.iloc[validation_indices]
    y_encoded = y_encoded[validation_indices]


print("Validation samples:", len(X))

print("\nRunning predictions...")

start_time = time.perf_counter()

predictions = model.predict(X)

end_time = time.perf_counter()

total_time = end_time - start_time

print("Prediction completed.")

accuracy = accuracy_score(
    y_encoded,
    predictions,
)

precision_weighted = precision_score(
    y_encoded,
    predictions,
    average="weighted",
    zero_division=0,
)

recall_weighted = recall_score(
    y_encoded,
    predictions,
    average="weighted",
    zero_division=0,
)

f1_weighted = f1_score(
    y_encoded,
    predictions,
    average="weighted",
    zero_division=0,
)

precision_macro = precision_score(
    y_encoded,
    predictions,
    average="macro",
    zero_division=0,
)

recall_macro = recall_score(
    y_encoded,
    predictions,
    average="macro",
    zero_division=0,
)

f1_macro = f1_score(
    y_encoded,
    predictions,
    average="macro",
    zero_division=0,
)

average_latency_ms = (
    total_time / len(X)
) * 1000

predictions_per_second = (
    len(X) / total_time
)

confidence_available = hasattr(
    model,
    "predict_proba",
)

if confidence_available:

    probabilities = model.predict_proba(X)

    confidence_scores = np.max(
        probabilities,
        axis=1,
    )

    average_confidence = (
        np.mean(confidence_scores) * 100
    )

else:

    average_confidence = None

report = classification_report(
    y_encoded,
    predictions,
    target_names=encoder.classes_,
    zero_division=0,
)

cm = confusion_matrix(
    y_encoded,
    predictions,
)

print("\n" + "=" * 70)
print("MODEL PERFORMANCE")
print("=" * 70)

print(f"Validation Samples     : {len(X):,}")

print(
    f"Accuracy               : {accuracy:.4f}"
)

print(
    f"Weighted Precision     : {precision_weighted:.4f}"
)

print(
    f"Weighted Recall        : {recall_weighted:.4f}"
)

print(
    f"Weighted F1 Score      : {f1_weighted:.4f}"
)

print(
    f"Macro Precision        : {precision_macro:.4f}"
)

print(
    f"Macro Recall           : {recall_macro:.4f}"
)

print(
    f"Macro F1 Score         : {f1_macro:.4f}"
)

print("\n" + "=" * 70)
print("PERFORMANCE / SPEED")
print("=" * 70)

print(
    f"Total Prediction Time  : {total_time:.4f} seconds"
)

print(
    f"Average Prediction     : {average_latency_ms:.4f} ms"
)

print(
    f"Predictions / Second   : {predictions_per_second:.2f}"
)

if average_confidence is not None:

    print(
        f"Average Confidence     : {average_confidence:.2f}%"
    )


print("\n" + "=" * 70)
print("CLASSIFICATION REPORT")
print("=" * 70)

print(report)


print("\n" + "=" * 70)
print("CONFUSION MATRIX")
print("=" * 70)

print(cm)


# ==========================================================
# SAVE REPORT
# ==========================================================

with open(
    REPORT_PATH,
    "w",
    encoding="utf-8",
) as file:

    file.write(
        "NETSHIELD AI - MODEL VALIDATION REPORT\n"
    )

    file.write("=" * 70 + "\n\n")

    file.write(
        f"Validation Samples: {len(X):,}\n\n"
    )

    file.write(
        f"Accuracy: {accuracy:.4f}\n"
    )

    file.write(
        f"Weighted Precision: {precision_weighted:.4f}\n"
    )

    file.write(
        f"Weighted Recall: {recall_weighted:.4f}\n"
    )

    file.write(
        f"Weighted F1 Score: {f1_weighted:.4f}\n"
    )

    file.write(
        f"Macro Precision: {precision_macro:.4f}\n"
    )

    file.write(
        f"Macro Recall: {recall_macro:.4f}\n"
    )

    file.write(
        f"Macro F1 Score: {f1_macro:.4f}\n\n"
    )

    file.write(
        f"Total Prediction Time: "
        f"{total_time:.4f} seconds\n"
    )

    file.write(
        f"Average Prediction Latency: "
        f"{average_latency_ms:.4f} ms\n"
    )

    file.write(
        f"Predictions Per Second: "
        f"{predictions_per_second:.2f}\n"
    )

    if average_confidence is not None:

        file.write(
            f"Average Confidence: "
            f"{average_confidence:.2f}%\n"
        )

    file.write(
        "\n\nCLASSIFICATION REPORT\n"
    )

    file.write("=" * 70 + "\n")

    file.write(report)

    file.write(
        "\n\nCONFUSION MATRIX\n"
    )

    file.write("=" * 70 + "\n")

    file.write(
        np.array2string(cm)
    )


print("\n" + "=" * 70)
print("VALIDATION COMPLETED SUCCESSFULLY")
print("=" * 70)

print("\nReport saved to:")
print(REPORT_PATH)