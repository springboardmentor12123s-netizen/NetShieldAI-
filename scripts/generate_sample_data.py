"""Generate CICIDS-style training and prediction CSVs for a local demo.

By default produces ~1,000,000 total rows (900,000 training + 100,000
prediction).  Use the ``--training`` and ``--prediction`` CLI flags to
override the row counts.

Usage
-----
    python scripts/generate_sample_data.py                        # 1M rows
    python scripts/generate_sample_data.py --training 400 --prediction 100  # small demo
"""

import argparse
import csv
import random
from pathlib import Path

random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "sample_data"
FIELDS = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Packet Length Mean",
    "Average Packet Size",
    "Label",
]

# Anomaly ratio — 10% of the total rows are attack traffic.
_ANOMALY_RATIO = 0.10


def make_row(anomaly: bool) -> dict:
    """Generate a single synthetic network flow row."""
    factor = random.uniform(7, 15) if anomaly else random.uniform(0.75, 1.3)
    return {
        "Destination Port": random.choice([22, 53, 80, 443, 8080]),
        "Flow Duration": round(random.uniform(800, 12000) * factor, 2),
        "Total Fwd Packets": round(random.uniform(3, 25) * factor, 2),
        "Total Backward Packets": round(random.uniform(2, 20) * factor, 2),
        "Flow Bytes/s": round(random.uniform(500, 6000) * factor, 2),
        "Flow Packets/s": round(random.uniform(2, 80) * factor, 2),
        "Packet Length Mean": round(random.uniform(40, 850) * factor, 2),
        "Average Packet Size": round(random.uniform(60, 900) * factor, 2),
        "Label": "DDoS" if anomaly else "BENIGN",
    }


def write_csv(name: str, normal: int, anomalies: int) -> None:
    """Write a shuffled CSV with the given normal/anomaly row counts."""
    total = normal + anomalies
    print(f"  Generating {name} — {total:,} rows ({normal:,} normal, {anomalies:,} anomaly) ...")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / name

    # Stream rows directly to disk to keep memory usage constant.
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()

        # Build a shuffled index of labels instead of holding all rows in RAM.
        labels = [False] * normal + [True] * anomalies
        random.shuffle(labels)

        for is_anomaly in labels:
            writer.writerow(make_row(is_anomaly))

    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"  ✓ {name} written ({size_mb:.1f} MB)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate CICIDS-style sample CSV datasets for NetShield AI.",
    )
    parser.add_argument(
        "--training", type=int, default=900_000,
        help="Total rows in the training CSV (default: 900,000).",
    )
    parser.add_argument(
        "--prediction", type=int, default=100_000,
        help="Total rows in the prediction CSV (default: 100,000).",
    )
    args = parser.parse_args()

    training_total = args.training
    prediction_total = args.prediction
    training_anomalies = int(training_total * _ANOMALY_RATIO)
    training_normal = training_total - training_anomalies
    prediction_anomalies = int(prediction_total * _ANOMALY_RATIO)
    prediction_normal = prediction_total - prediction_anomalies

    print(f"\nNetShield AI — Sample Data Generator")
    print(f"  Training:   {training_total:>10,} rows")
    print(f"  Prediction: {prediction_total:>10,} rows")
    print(f"  Total:      {training_total + prediction_total:>10,} rows\n")

    write_csv("training_sample.csv", normal=training_normal, anomalies=training_anomalies)
    write_csv("prediction_sample.csv", normal=prediction_normal, anomalies=prediction_anomalies)

    print("\nSample training and prediction files created.")


if __name__ == "__main__":
    main()
