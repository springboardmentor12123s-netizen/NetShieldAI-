import os
import sys
import pandas as pd
import numpy as np

backend_path = os.path.abspath("../backend")

if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.database import SessionLocal
from app.models.ai_dataset import AIDataset

print("=" * 60)
print("IMPORTING CICIDS2017 DATASET")
print("=" * 60)

df = pd.read_csv("cleaned_dataset.csv")

print("\nDataset Loaded")
print("Rows :", len(df))

# ----------------------------
# Clean Column Names
# ----------------------------

df.columns = [c.strip() for c in df.columns]

# Remove Label temporarily
labels = df["Label"]
df = df.drop(columns=["Label"])

# Replace invalid values
df = df.replace([np.inf, -np.inf], np.nan)
df = df.fillna(0)

# Take sample for development
MAX_ROWS = 10000

if len(df) > MAX_ROWS:
    df = df.sample(MAX_ROWS, random_state=42)
    labels = labels.loc[df.index]

print("\nRows Selected :", len(df))

db = SessionLocal()

print("\nImporting into PostgreSQL...\n")

count = 0

for index, row in df.iterrows():

    packet = AIDataset()

    for column in df.columns:

        attribute = (
            column.lower()
            .replace(" ", "_")
            .replace("/", "_per_")
            .replace(".", "_")
            .replace("-", "_")
        )

        attribute = "".join(
            c for c in attribute if c.isalnum() or c == "_"
        )

        setattr(packet, attribute, float(row[column]))

    packet.label = str(labels.loc[index])

    db.add(packet)

    count += 1

    if count % 500 == 0:
        db.commit()
        print(f"{count} rows imported...")

db.commit()
db.close()

print("\n")
print("=" * 60)
print("IMPORT COMPLETED SUCCESSFULLY")
print("=" * 60)
print("Rows Imported :", count)