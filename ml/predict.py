import os
import sys
import random
import joblib
import pandas as pd

backend_path = os.path.abspath("../backend")

if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.database import SessionLocal
from app.models.ai_dataset import AIDataset
from app.models.anomaly import Anomaly

print("=" * 60)
print("AI PREDICTION ENGINE")
print("=" * 60)

# --------------------------
# Load AI Model
# --------------------------

model = joblib.load("models/model.pkl")
features = joblib.load("models/feature_names.pkl")
encoder = joblib.load("models/label_encoder.pkl")

print("Model Loaded Successfully")

db = SessionLocal()

rows = db.query(AIDataset).limit(1000).all()

print("Rows Loaded :", len(rows))

predictions = 0

for row in rows:

    values = []

    for feature in features:

        attr = (
            feature.lower()
            .replace(" ", "_")
            .replace("/", "_per_")
            .replace(".", "_")
            .replace("-", "_")
        )

        attr = "".join(
            c for c in attr if c.isalnum() or c == "_"
        )

        values.append(getattr(row, attr))

    X = pd.DataFrame([values], columns=features)

    prediction = model.predict(X)[0]

    probability = model.predict_proba(X).max()

    attack = encoder.inverse_transform([prediction])[0]

    anomaly = Anomaly(

        source_ip=f"192.168.1.{random.randint(2,250)}",

        destination_ip=f"10.0.0.{random.randint(2,250)}",

        anomaly_type=attack,

        confidence_score=float(probability),

        status="Detected"

    )

    db.add(anomaly)

    predictions += 1

    if predictions % 100 == 0:

        db.commit()

        print(predictions, "predictions completed")

db.commit()

db.close()

print()

print("=" * 60)
print("PREDICTION COMPLETED")
print("=" * 60)

print("Total Predictions :", predictions)