import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

train = pd.read_csv(os.path.join(BASE_DIR, "ml/models/train_processed.csv"))
test = pd.read_csv(os.path.join(BASE_DIR, "ml/models/test_processed.csv"))

# Remove unwanted columns
DROP = ["id", "label"]

X_train = train.drop(columns=DROP + ["attack_cat"])
X_test = test.drop(columns=DROP + ["attack_cat"])

encoder = LabelEncoder()

y_train = encoder.fit_transform(train["attack_cat"])
y_test = encoder.transform(test["attack_cat"])

print("\nTraining Threat Classification Model...\n")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

pred = model.predict(X_test)

accuracy = accuracy_score(y_test, pred)

print(f"\nAccuracy : {accuracy*100:.2f}%\n")

print(classification_report(y_test, pred))

os.makedirs("ml/models", exist_ok=True)

joblib.dump(model, "ml/models/threat_classifier.pkl")
joblib.dump(encoder, "ml/models/attack_encoder.pkl")

print("\nThreat Classifier Saved Successfully")