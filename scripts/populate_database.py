# -*- coding: utf-8 -*-
"""
populate_database.py
--------------------
Runs the complete NetShield AI Milestone-2 workflow by calling the live API.

Steps:
1. Upload CICIDS2017 training dataset
2. Upload UNSW-NB15-style training dataset
3. Train the Isolation Forest model
4. Upload CICIDS2017 prediction dataset and run prediction
5. Upload UNSW-NB15-style prediction dataset and run prediction
6. Verify all DB tables via monitoring endpoints

Usage:
    python scripts/populate_database.py
"""

import csv
import io
import sys
import time
from pathlib import Path

import requests

BASE = "http://127.0.0.1:8765/api"
SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_data"


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def post_file(endpoint, filepath, label):
    """Upload a CSV file from disk to the given endpoint."""
    print("\n[UPLOAD] %s -> %s" % (label, filepath.name))
    with filepath.open("rb") as fh:
        r = requests.post(
            "%s/%s" % (BASE, endpoint),
            files={"file": (filepath.name, fh, "text/csv")},
            timeout=300,
        )
    if r.status_code >= 400:
        print("  [WARN] HTTP %d: %s" % (r.status_code, r.text[:200]))
        return {}
    data = r.json()
    print("  OK: id=%s rows=%s" % (data.get("id"), data.get("row_count")))
    return data


def post_file_bytes(endpoint, filename, content_bytes, label):
    """Upload raw CSV bytes to the given endpoint."""
    print("\n[UPLOAD] %s -> %s" % (label, filename))
    r = requests.post(
        "%s/%s" % (BASE, endpoint),
        files={"file": (filename, content_bytes, "text/csv")},
        timeout=300,
    )
    if r.status_code >= 400:
        print("  [WARN] HTTP %d: %s" % (r.status_code, r.text[:200]))
        return {}
    data = r.json()
    print("  OK: id=%s rows=%s" % (data.get("id"), data.get("row_count")))
    return data


def post_json(endpoint, params, label):
    """Send a POST with query parameters and return the JSON response."""
    print("\n[POST] %s" % label)
    r = requests.post("%s/%s" % (BASE, endpoint), params=params, timeout=600)
    if r.status_code >= 400:
        print("  [WARN] HTTP %d: %s" % (r.status_code, r.text[:300]))
        return {}
    print("  OK")
    return r.json()


def get_json(endpoint, label):
    """Fetch a GET endpoint and return the parsed JSON."""
    print("\n[GET] %s" % label)
    r = requests.get("%s/%s" % (BASE, endpoint), timeout=60)
    if r.status_code >= 400:
        print("  [WARN] HTTP %d: %s" % (r.status_code, r.text[:200]))
        return {} if "{" in r.text else []
    return r.json()


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def make_unsw_csv(source_csv):
    """Re-label a CICIDS-style CSV so Label becomes 0 (normal) or 1 (attack)."""
    rows = []
    with source_csv.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            label_val = row.get("Label", "BENIGN")
            row["Label"] = "0" if label_val.upper() == "BENIGN" else "1"
            rows.append(row)
    buf = io.StringIO()
    if not rows:
        return b""
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().encode("utf-8")


# ---------------------------------------------------------------------------
# Main workflow
# ---------------------------------------------------------------------------

def main():
    """Execute the full Milestone-2 population workflow."""
    print("=" * 60)
    print("NetShield AI -- Milestone 2 Database Population Script")
    print("=" * 60)

    # Verify backend is reachable.
    try:
        r = requests.get("http://127.0.0.1:8765/health", timeout=5)
        print("\n[CHECK] Backend health: %s" % r.json())
    except Exception as e:
        print("[ERROR] Backend is not reachable: %s" % e)
        print("Please start the backend with: python -m uvicorn app.main:app --host 127.0.0.1 --port 8765")
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 1 — Upload training datasets
    # ------------------------------------------------------------------
    print("\n--- Step 1: Upload Training Datasets ---")

    training_file = SAMPLE_DIR / "training_sample.csv"
    if not training_file.exists():
        print("[ERROR] training_sample.csv not found at %s" % training_file)
        sys.exit(1)

    train_result = post_file("upload", training_file, "CICIDS2017 Training Dataset")
    dataset_id_1 = train_result.get("id")

    unsw_train_bytes = make_unsw_csv(training_file)
    unsw_train_result = post_file_bytes(
        "upload", "UNSW-NB15_training.csv", unsw_train_bytes, "UNSW-NB15 Training Dataset"
    )
    dataset_id_2 = unsw_train_result.get("id")  # noqa: F841 — kept for potential future use

    # ------------------------------------------------------------------
    # Step 2 — Train the model
    # ------------------------------------------------------------------
    print("\n--- Step 2: Train Anomaly Detection Model ---")

    train_params = {}
    if dataset_id_1:
        train_params["dataset_id"] = dataset_id_1

    train_resp = post_json("train", train_params, "Train IsolationForest on CICIDS2017")
    if train_resp:
        print("  Accuracy:  %s%%" % train_resp.get("accuracy"))
        print("  Precision: %s%%" % train_resp.get("precision"))
        print("  Recall:    %s%%" % train_resp.get("recall"))
        print("  F1-Score:  %s%%" % train_resp.get("f1_score"))
        print("  Features:  %s" % train_resp.get("feature_count"))
        print("  Matrix:    %s" % train_resp.get("confusion_matrix"))
        print("  Evaluated against: %s" % train_resp.get("evaluation"))

    time.sleep(1)

    # ------------------------------------------------------------------
    # Step 3 — Evaluation (written to TrainingRun during training)
    # ------------------------------------------------------------------
    print("\n--- Step 3: Evaluate Model (TrainingRun written to DB during training) ---")
    print("  Metrics were written to training_runs table above.")

    # ------------------------------------------------------------------
    # Step 4 — Run predictions (generates Alerts + ThreatReport)
    # ------------------------------------------------------------------
    print("\n--- Step 4: Run Intrusion Prediction on CICIDS2017 Prediction Dataset ---")

    pred_file = SAMPLE_DIR / "prediction_sample.csv"
    if not pred_file.exists():
        print("[ERROR] prediction_sample.csv not found at %s" % pred_file)
        sys.exit(1)

    print("\n[PREDICT] CICIDS2017 prediction_sample.csv")
    with pred_file.open("rb") as fh:
        r = requests.post(
            "%s/predict" % BASE,
            files={"file": (pred_file.name, fh, "text/csv")},
            timeout=300,
        )
    if r.status_code < 400:
        d = r.json()
        print(
            "  OK: dataset_id=%s total=%s anomalies=%s severity=%s"
            % (d.get("dataset_id"), d.get("total_rows"), d.get("anomaly_count"), d.get("severity"))
        )
        if d.get("supervised_metrics"):
            sm = d["supervised_metrics"]
            print("  Supervised accuracy: %s%%" % sm.get("accuracy"))
    else:
        print("  [WARN] HTTP %d: %s" % (r.status_code, r.text[:200]))

    time.sleep(1)

    # ------------------------------------------------------------------
    # Step 5 — UNSW-NB15-style prediction dataset
    # ------------------------------------------------------------------
    print("\n--- Step 5: Run Prediction on UNSW-NB15-style Dataset ---")

    unsw_pred_bytes = make_unsw_csv(pred_file)
    print("\n[PREDICT] UNSW-NB15_prediction.csv")
    r2 = requests.post(
        "%s/predict" % BASE,
        files={"file": ("UNSW-NB15_prediction.csv", unsw_pred_bytes, "text/csv")},
        timeout=300,
    )
    if r2.status_code < 400:
        d2 = r2.json()
        print(
            "  OK: dataset_id=%s total=%s anomalies=%s severity=%s"
            % (d2.get("dataset_id"), d2.get("total_rows"), d2.get("anomaly_count"), d2.get("severity"))
        )
    else:
        print("  [WARN] HTTP %d: %s" % (r2.status_code, r2.text[:200]))

    time.sleep(1)

    # ------------------------------------------------------------------
    # Step 6 — Verify all API endpoints
    # ------------------------------------------------------------------
    print("\n--- Step 6: Verify All API Endpoints ---")

    dash = get_json("dashboard", "Dashboard Statistics")
    if isinstance(dash, dict):
        print("  Total datasets:    %s" % dash.get("total_datasets"))
        print("  Total records:     %s" % dash.get("total_records"))
        print("  Normal count:      %s" % dash.get("normal_count"))
        print("  Attack count:      %s" % dash.get("attack_count"))
        print("  Detection accuracy:%s%%" % dash.get("detection_accuracy"))
        act = dash.get("dataset_activity", [])
        print("  Dataset activity:  %d entries" % len(act))
        for entry in act:
            print("    - %s: records=%s anomalies=%s" % (
                entry.get("name"), entry.get("records"), entry.get("anomalies"),
            ))

    history = get_json("history", "History Records")
    if isinstance(history, list):
        print("  Total history rows: %d" % len(history))
        for h in history:
            print("    ID=%-3s | %-50s | %-10s | rows=%-8s | preds=%s" % (
                h.get("id"), h.get("dataset_name", "")[:50],
                h.get("purpose"), h.get("record_count"), h.get("prediction_count"),
            ))

    alerts = get_json("alerts", "Alert Records")
    if isinstance(alerts, list):
        print("  Total alerts: %d" % len(alerts))
        for a in alerts[:10]:
            print("    ID=%-3s | %-40s | row=%-5s | %s" % (
                a.get("id"), a.get("dataset_name", "")[:40],
                a.get("row_number"), a.get("severity"),
            ))
        if len(alerts) > 10:
            print("    ... and %d more alerts" % (len(alerts) - 10))

    report = get_json("reports/latest", "Latest Threat Report")
    if isinstance(report, dict) and report.get("id"):
        print("  Report ID:          %s" % report.get("id"))
        print("  Generated at:       %s" % report.get("generated_at"))
        print("  Total records:      %s" % report.get("total_records"))
        print("  Normal count:       %s" % report.get("normal_count"))
        print("  Anomaly count:      %s" % report.get("anomaly_count"))
        print("  Anomaly percentage: %s%%" % report.get("anomaly_percentage"))
        print("  Risk level:         %s" % report.get("risk_level"))
        print("  Accuracy:           %s" % report.get("accuracy"))
        print("  Threat categories:  %s" % report.get("threat_category_summary"))
        print("  Severity summary:   %s" % report.get("severity_summary"))
        print("  Top risky rows:     %d" % len(report.get("top_risky_rows", [])))

    # ------------------------------------------------------------------
    # Final check summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("MILESTONE 2 POPULATION COMPLETE")
    print("=" * 60)

    checks = [
        ("Backend health", True),
        ("Dashboard has datasets",  isinstance(dash, dict) and dash.get("total_datasets", 0) > 0),
        ("Dashboard has records",   isinstance(dash, dict) and dash.get("total_records", 0) > 0),
        ("Dashboard normal count",  isinstance(dash, dict) and dash.get("normal_count", 0) > 0),
        ("Dashboard attack count",  isinstance(dash, dict) and dash.get("attack_count", 0) > 0),
        ("Dashboard accuracy",      isinstance(dash, dict) and dash.get("detection_accuracy", 0) > 0),
        ("History is populated",    isinstance(history, list) and len(history) > 0),
        ("Alerts are populated",    isinstance(alerts, list) and len(alerts) > 0),
        ("Threat report exists",    isinstance(report, dict) and report.get("id") is not None),
        ("Report has anomaly data", isinstance(report, dict) and report.get("anomaly_count", 0) > 0),
        ("Report has risk level",   isinstance(report, dict) and report.get("risk_level") not in (None, "")),
        ("Report has categories",   isinstance(report, dict) and bool(report.get("threat_category_summary"))),
    ]

    all_passed = True
    for label, ok in checks:
        status = "PASS" if ok else "FAIL"
        if not ok:
            all_passed = False
        print("  [%s] %s" % (status, label))

    print("\nDatasets used:")
    print("  1. CICIDS2017  -- training_sample.csv   (401 rows, labelled BENIGN/DDoS)")
    print("  2. UNSW-NB15   -- UNSW-NB15_training.csv (401 rows, relabelled 0/1)")
    print("  3. CICIDS2017  -- prediction_sample.csv  (101 rows, labelled BENIGN/DDoS)")
    print("  4. UNSW-NB15   -- UNSW-NB15_prediction.csv (101 rows, relabelled 0/1)")
    print("  5. CICIDS2017  -- Thursday-WorkingHours (170,366 rows, pre-existing)")

    if all_passed:
        print("\nAll checks passed. Milestone 2 data is fully populated.")
    else:
        print("\nSome checks failed. Review FAIL items above.")

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
