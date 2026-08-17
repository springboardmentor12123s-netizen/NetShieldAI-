import joblib
import pandas as pd
import numpy as np

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)


DATASET_PATH = (
    "attack_validation/"
    "Thursday-WebAttacks-Timestamps.parquet"
)

MODEL_PATH = "app/ai/model.pkl"
FEATURE_COLUMNS_PATH = "app/ai/feature_columns.pkl"
LABEL_ENCODER_PATH = "app/ai/label_encoder.pkl"


# ============================================================
# LOAD MODEL
# ============================================================

print("\nLoading model...")

model = joblib.load(MODEL_PATH)

feature_columns = joblib.load(
    FEATURE_COLUMNS_PATH
)

label_encoder = joblib.load(
    LABEL_ENCODER_PATH
)

print(
    f"Model features: {len(feature_columns)}"
)


# ============================================================
# LOAD VALIDATION DATASET
# ============================================================

print("\nLoading attack validation dataset...")

df = pd.read_parquet(
    DATASET_PATH
)

print(
    f"Total validation records: {len(df)}"
)


# ============================================================
# RENAME VALIDATION COLUMNS
# ============================================================

column_mapping = {

    "Total Length of Fwd Packets":
        "Fwd Packets Length Total",

    "Total Length of Bwd Packets":
        "Bwd Packets Length Total",

    "Min Packet Length":
        "Packet Length Min",

    "Max Packet Length":
        "Packet Length Max",

    "Average Packet Size":
        "Avg Packet Size",

    "Init_Win_bytes_forward":
        "Init Fwd Win Bytes",

    "Init_Win_bytes_backward":
        "Init Bwd Win Bytes",

    "act_data_pkt_fwd":
        "Fwd Act Data Packets",

    "min_seg_size_forward":
        "Fwd Seg Size Min"
}

df = df.rename(
    columns=column_mapping
)


# ============================================================
# CHECK REQUIRED FEATURES
# ============================================================

missing_features = [
    feature
    for feature in feature_columns
    if feature not in df.columns
]

if missing_features:

    print("\nMissing model features:")

    for feature in missing_features:
        print(f" - {feature}")

    raise ValueError(
        "Validation dataset is missing "
        "required model features."
    )


# ============================================================
# PREPARE FEATURES
# ============================================================

X = df[
    feature_columns
].copy()

# Convert every feature to numeric
X = X.apply(
    pd.to_numeric,
    errors="coerce"
)

# Convert to float
X = X.astype("float64")


# ============================================================
# FIND VALID ROWS
# ============================================================

finite_mask = np.isfinite(
    X.to_numpy()
).all(axis=1)

not_null_mask = X.notna().all(
    axis=1
).to_numpy()

valid_mask = (
    finite_mask
    & not_null_mask
)


print(
    f"\nValid feature rows: "
    f"{valid_mask.sum()}"
)

print(
    f"Invalid rows removed: "
    f"{(~valid_mask).sum()}"
)


# ============================================================
# APPLY SAME MASK TO X AND LABELS
# ============================================================

X = X.loc[
    valid_mask
].reset_index(drop=True)

y_text = df.loc[
    valid_mask,
    "Label"
].astype(str).reset_index(drop=True)


# ============================================================
# MAP LABELS TO MODEL LABELS
# ============================================================

encoder_classes = list(
    label_encoder.classes_
)

print(
    "\nModel encoder classes:"
)

print(
    encoder_classes
)


def normalize_label(label):

    label = str(
        label
    ).strip()

    if label.upper() == "BENIGN":
        return encoder_classes[0]

    if "BRUTE FORCE" in label.upper():
        return encoder_classes[1]

    if "SQL INJECTION" in label.upper():
        return encoder_classes[2]

    if "XSS" in label.upper():
        return encoder_classes[3]

    return None


y_text = y_text.apply(
    normalize_label
)


# ============================================================
# CHECK LABELS
# ============================================================

if y_text.isna().any():

    print(
        "\nUnknown labels found."
    )

    raise ValueError(
        "Some validation labels "
        "could not be mapped."
    )


print(
    "\nMapped validation labels:"
)

print(
    y_text.value_counts()
)


# ============================================================
# ENCODE LABELS
# ============================================================

y = label_encoder.transform(
    y_text
)


# ============================================================
# MODEL PREDICTION
# ============================================================

print(
    "\nRunning predictions..."
)

predictions = model.predict(
    X
)


# ============================================================
# METRICS
# ============================================================

accuracy = accuracy_score(
    y,
    predictions
)

precision = precision_score(
    y,
    predictions,
    average="macro",
    zero_division=0
)

recall = recall_score(
    y,
    predictions,
    average="macro",
    zero_division=0
)

f1 = f1_score(
    y,
    predictions,
    average="macro",
    zero_division=0
)

confusion = confusion_matrix(
    y,
    predictions
)

report = classification_report(
    y,
    predictions,
    target_names=encoder_classes,
    zero_division=0
)


# ============================================================
# RESULTS
# ============================================================

print("\n")
print("=" * 60)
print(
    "       ATTACK VALIDATION RESULTS"
)
print("=" * 60)

print(
    f"Accuracy          : "
    f"{accuracy * 100:.2f}%"
)

print(
    f"Precision (Macro) : "
    f"{precision * 100:.2f}%"
)

print(
    f"Recall (Macro)    : "
    f"{recall * 100:.2f}%"
)

print(
    f"F1 Score (Macro)  : "
    f"{f1 * 100:.2f}%"
)

print(
    f"Total Samples     : "
    f"{len(y)}"
)


print(
    "\nConfusion Matrix:"
)

print(
    confusion
)


print(
    "\nClassification Report:"
)

print(
    report
)

print(
    "=" * 60
)