import os
import glob
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "..",
    "datasets",
    "CICIDS2017"
)

MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "feature_columns.pkl")


print("Loading CICIDS2017...")

files = glob.glob(os.path.join(DATASET_PATH, "*.csv"))

dataframes = []

for file in files:

    print("Reading:", os.path.basename(file))

    df = pd.read_csv(
        file,
        low_memory=False,
        on_bad_lines="skip",
        encoding="latin1"
    )

    dataframes.append(df)

df = pd.concat(dataframes, ignore_index=True)

print("Total Records:", len(df))


# -------------------------
# Clean Columns
# -------------------------

df.columns = df.columns.str.strip()

# Remove Infinity

df.replace([np.inf, -np.inf], np.nan, inplace=True)

df.dropna(inplace=True)

print("After Cleaning:", len(df))


# -------------------------
# Features / Labels
# -------------------------

X = df.drop("Label", axis=1)

y = df["Label"]


# Convert every feature to numeric

X = X.apply(pd.to_numeric, errors="coerce")

X.fillna(0, inplace=True)


# -------------------------
# Encode Labels
# -------------------------

encoder = LabelEncoder()

y = encoder.fit_transform(y)


# -------------------------
# Split
# -------------------------

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42,

    stratify=y

)


# -------------------------
# Train RF
# -------------------------

print("Training Random Forest...")

model = RandomForestClassifier(

    n_estimators=150,

    random_state=42,

    n_jobs=-1

)

model.fit(X_train, y_train)


# -------------------------
# Test
# -------------------------

pred = model.predict(X_test)

acc = accuracy_score(y_test, pred)

print()

print("="*50)

print("Accuracy :", round(acc*100,2), "%")

print("="*50)

print()

print(classification_report(

    y_test,

    pred,

    target_names=encoder.classes_

))


# -------------------------
# Save
# -------------------------

joblib.dump(model, MODEL_PATH)

joblib.dump(encoder, LABEL_ENCODER_PATH)

joblib.dump(list(X.columns), FEATURES_PATH)

print()

print("Model Saved")

print(MODEL_PATH)