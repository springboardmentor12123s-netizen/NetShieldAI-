import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from app.ai.preprocess import preprocess_data

# Load processed data
X, y = preprocess_data()

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Random Forest Model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Predictions
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)
joblib.dump(
    {
        "accuracy": accuracy,
        "classification_report": classification_report(
            y_test,
            predictions,
            output_dict=True
        )
    },
    "app/ai/model_metrics.pkl"
)
print(f"\nAccuracy : {accuracy*100:.2f}%")

print(classification_report(y_test, predictions))

# Save model
joblib.dump(model, "app/ai/model.pkl")

print("\nModel Saved Successfully")