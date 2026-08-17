import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)

from app.ai.preprocess import preprocess_data


# ==============================
# Load processed data
# ==============================

X, y = preprocess_data()


# ==============================
# Train / Test Split
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ==============================
# Random Forest Model
# ==============================

model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)


# ==============================
# Predictions
# ==============================

predictions = model.predict(X_test)


# ==============================
# Model Metrics
# ==============================

accuracy = accuracy_score(
    y_test,
    predictions
)

precision_macro = precision_score(
    y_test,
    predictions,
    average="macro",
    zero_division=0
)

recall_macro = recall_score(
    y_test,
    predictions,
    average="macro",
    zero_division=0
)

f1_macro = f1_score(
    y_test,
    predictions,
    average="macro",
    zero_division=0
)


# ==============================
# Classification Report
# ==============================

report = classification_report(
    y_test,
    predictions,
    output_dict=True,
    zero_division=0
)


# ==============================
# Confusion Matrix
# ==============================

cm = confusion_matrix(
    y_test,
    predictions
)


# ==============================
# ROC-AUC
# ==============================

roc_auc = None

try:

    probabilities = model.predict_proba(X_test)

    roc_auc = roc_auc_score(
        y_test,
        probabilities,
        multi_class="ovr",
        average="macro"
    )

except Exception as e:

    print("\nROC-AUC could not be calculated:")
    print(e)


# ==============================
# Save Metrics
# ==============================

metrics = {
    "accuracy": accuracy,
    "precision_macro": precision_macro,
    "recall_macro": recall_macro,
    "f1_macro": f1_macro,
    "roc_auc": roc_auc,
    "confusion_matrix": cm.tolist(),
    "classification_report": report
}

joblib.dump(
    metrics,
    "app/ai/model_metrics.pkl"
)


# ==============================
# Display Results
# ==============================

print("\n====================================")
print("       MODEL VALIDATION RESULTS")
print("====================================")

print(f"Accuracy          : {accuracy * 100:.2f}%")
print(f"Precision (Macro) : {precision_macro * 100:.2f}%")
print(f"Recall (Macro)    : {recall_macro * 100:.2f}%")
print(f"F1 Score (Macro)  : {f1_macro * 100:.2f}%")

if roc_auc is not None:
    print(f"ROC-AUC           : {roc_auc * 100:.2f}%")
else:
    print("ROC-AUC           : Not available")

print("\nConfusion Matrix:")
print(cm)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)

print("====================================")


# ==============================
# Save Model
# ==============================

joblib.dump(
    model,
    "app/ai/model.pkl"
)

print("\nModel Saved Successfully")
print("Metrics Saved Successfully")