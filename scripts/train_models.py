"""CLI Script to train models on the CIC-IDS-2017 dataset and generate reports."""

import os
import sys
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Insert backend folder to front of python system search path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_dir, "..", "backend"))

from app.ai.training.trainer import ModelTrainer
from app.ai.evaluation.evaluator import ModelEvaluator


def main():
    print("====================================================")
    print("NetShield AI - Machine Learning Model Training Engine")
    print("====================================================")
    print("Training on CIC-IDS-2017 dataset (direct CSV mode)")
    print()

    trainer = ModelTrainer(contamination=0.05, n_estimators=200)
    evaluator = ModelEvaluator()

    start_time = time.time()

    try:
        # Run training pipeline (no MongoDB needed)
        metrics = trainer.train_and_evaluate()

        # Write reports
        evaluator.write_reports(metrics)

        elapsed = time.time() - start_time

        print()
        print("=" * 60)
        print("[SUCCESS] Training completed successfully.")
        print(f"  Dataset Size:  {metrics.get('total_csv_rows', 0):,} total rows")
        print(f"  Training Size: {metrics.get('dataset_size', 0):,} rows (sampled)")
        print(f"  Features:      {metrics.get('n_features', 0)}")
        print(f"  Accuracy:      {metrics.get('threat_classifier_accuracy', 0)*100:.2f}%")
        print(f"  Anomalies:     {metrics.get('anomalies_flagged', 0)}")
        print(f"  Time Elapsed:  {elapsed:.1f}s")
        print("=" * 60)

    except Exception as e:
        print(f"\n[FATAL] Model training failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
