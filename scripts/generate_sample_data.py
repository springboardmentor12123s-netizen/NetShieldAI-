"""Generate small CICIDS-style training and prediction CSVs for a local demo."""

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
    rows = [make_row(False) for _ in range(normal)] + [make_row(True) for _ in range(anomalies)]
    random.shuffle(rows)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUTPUT_DIR / name).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    write_csv("training_sample.csv", normal=360, anomalies=40)
    write_csv("prediction_sample.csv", normal=90, anomalies=10)
    print("Sample training and prediction files created.")
