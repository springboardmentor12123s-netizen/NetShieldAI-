"""Script to evaluate trained threat classification and anomaly detection models on the validation test set."""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, precision_recall_fscore_support

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Insert backend folder to front of python system search path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_dir, "..", "backend"))

from app.ai.training.trainer import ModelTrainer
from app.ai.preprocessing.preprocessor import CATEGORY_NAMES


def main():
    print("====================================================")
    print("NetShield AI - Machine Learning Model Evaluation Engine")
    print("====================================================")

    # 1. Paths configuration
    models_dir = os.path.join(script_dir, "..", "backend", "app", "ai", "models", "saved")
    reports_dir = os.path.join(script_dir, "..", "reports")
    os.makedirs(reports_dir, exist_ok=True)

    preprocessor_path = os.path.join(models_dir, "preprocessor.joblib")
    detector_path = os.path.join(models_dir, "anomaly_detector.joblib")
    classifier_path = os.path.join(models_dir, "threat_classifier.joblib")

    # 2. Check model existence
    if not (os.path.exists(preprocessor_path) and os.path.exists(detector_path) and os.path.exists(classifier_path)):
        print("[ERROR] Serialized models not found in backend/app/ai/models/saved/.")
        print("Please train the models first by running: python scripts/train_models.py")
        sys.exit(1)

    print("Loading serialized models...")
    preprocessor = joblib.load(preprocessor_path)
    from app.ai.models.anomaly_detector import AnomalyDetector
    from app.ai.models.threat_classifier import ThreatClassifier
    
    anomaly_detector = AnomalyDetector.load(detector_path)
    threat_classifier = ThreatClassifier.load(classifier_path)
    print("Models loaded successfully.")

    # 3. Load dataset
    print("\nLoading dataset from CSV files...")
    trainer = ModelTrainer()
    try:
        raw_df = trainer.load_data_from_csv()
    except Exception as e:
        print(f"[ERROR] Failed to load dataset: {e}")
        sys.exit(1)

    # Sample to keep memory consumption low with exact same random state
    print("Sampling and preprocessing data...")
    from app.ai.training.trainer import MAX_TRAINING_ROWS
    df = trainer._stratified_sample(raw_df, MAX_TRAINING_ROWS)

    # Transform without refitting to avoid target leakage
    X = preprocessor.transform_dataframe(df)
    y = preprocessor.extract_labels_from_dataframe(df)

    # Same split key to extract the validation set
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42,
        stratify=y if len(np.unique(y)) > 1 else None,
    )
    print(f"Validation set size: {len(y_test)} samples")

    # 4. Generate predictions
    print("\nGenerating model predictions...")
    y_pred = threat_classifier.predict(X_test)
    y_pred_proba = threat_classifier.predict_proba(X_test)
    
    anomaly_pred = anomaly_detector.predict(X_test) # 1 = normal, -1 = anomaly
    
    # 5. Calculate supervised classification metrics
    accuracy = accuracy_score(y_test, y_pred)
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)

    # Detailed class-wise metrics
    unique_classes = np.unique(np.concatenate([y_test, y_pred]))
    target_names = [CATEGORY_NAMES.get(int(c), f"Class {c}") for c in unique_classes]
    
    report_dict = classification_report(
        y_test, y_pred,
        labels=unique_classes,
        target_names=target_names,
        output_dict=True,
        zero_division=0
    )
    
    # 6. Confusion Matrix calculation
    cm = confusion_matrix(y_test, y_pred)

    # 7. Unsupervised anomaly detection metrics
    # Benchmark: y_test > 0 indicates actual class is an attack (anomaly)
    # y_test == 0 indicates benign (normal)
    y_test_anomaly = (y_test > 0).astype(int)
    anomaly_pred_binary = (anomaly_pred == -1).astype(int) # -1 is anomaly -> 1; 1 is normal -> 0
    
    anomaly_acc = accuracy_score(y_test_anomaly, anomaly_pred_binary)
    anomaly_p, anomaly_r, anomaly_f1, _ = precision_recall_fscore_support(y_test_anomaly, anomaly_pred_binary, average="binary", zero_division=0)

    # 8. Plot confusion matrix
    print("Generating confusion matrix plot...")
    try:
        import matplotlib.pyplot as plt
        
        plt.figure(figsize=(10, 8), facecolor='#090d16')
        ax = plt.subplot(111)
        ax.set_facecolor('#0c1322')
        
        # Plot heatmap
        im = ax.imshow(cm, cmap='Purples', interpolation='nearest')
        plt.colorbar(im, ax=ax)
        
        # Add labels
        tick_marks = np.arange(len(target_names))
        ax.set_xticks(tick_marks)
        ax.set_xticklabels(target_names, rotation=45, ha='right', color='#e2e8f0')
        ax.set_yticks(tick_marks)
        ax.set_yticklabels(target_names, color='#e2e8f0')
        
        # Color configuration
        thresh = cm.max() / 2.
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(j, i, format(cm[i, j], 'd'),
                        ha="center", va="center",
                        color="white" if cm[i, j] > thresh else "#94a3b8")
                        
        ax.spines['bottom'].set_color('#1e293b')
        ax.spines['top'].set_color('#1e293b')
        ax.spines['left'].set_color('#1e293b')
        ax.spines['right'].set_color('#1e293b')
        
        ax.xaxis.label.set_color('#94a3b8')
        ax.yaxis.label.set_color('#94a3b8')
        
        plt.title('NetShield AI - Threat Classification Confusion Matrix', color='white', pad=20, fontsize=14, fontweight='bold')
        plt.ylabel('True Threat Class')
        plt.xlabel('Predicted Threat Class')
        plt.tight_layout()
        
        cm_path = os.path.join(reports_dir, "confusion_matrix.png")
        plt.savefig(cm_path, dpi=150, facecolor='#090d16')
        plt.close()
        print(f"Confusion Matrix plot saved to {cm_path}")
    except Exception as e:
        print(f"WARNING: Matplotlib plotting failed: {e}")

    # 9. Format evaluation summaries
    evaluation_results = {
        "accuracy": float(accuracy),
        "precision": float(weighted_p),
        "recall": float(weighted_r),
        "f1_score": float(weighted_f1),
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "macro_f1_score": float(macro_f1),
        "test_cases": int(len(y_test)),
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict,
        "classes": target_names,
        "class_wise": {},
        "anomaly_detection": {
            "accuracy": float(anomaly_acc),
            "precision": float(anomaly_p),
            "recall": float(anomaly_r),
            "f1_score": float(anomaly_f1),
            "total_anomalies_flagged": int(np.sum(anomaly_pred == -1))
        }
    }

    # Populate class-wise metrics
    for name in target_names:
        if name in report_dict:
            scores = report_dict[name]
            evaluation_results["class_wise"][name] = {
                "precision": float(scores.get("precision", 0)),
                "recall": float(scores.get("recall", 0)),
                "f1-score": float(scores.get("f1-score", 0)),
                "support": int(scores.get("support", 0))
            }

    # 10. Save JSON files
    eval_path = os.path.join(reports_dir, "ai_model_evaluation.json")
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_results, f, indent=4)
        
    report_path = os.path.join(reports_dir, "classification_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_dict, f, indent=4)

    print(f"Evaluation report saved to {eval_path}")
    print(f"Classification report saved to {report_path}")

    # 11. Format summary display terminal
    print("\n" + "=" * 60)
    print("AI MODEL EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Test cases evaluated:   {len(y_test):,}")
    print(f"Overall Accuracy:      {accuracy * 100:.2f}%")
    print(f"Precision (weighted):  {weighted_p * 100:.2f}%")
    print(f"Recall (weighted):     {weighted_r * 100:.2f}%")
    print(f"F1-Score (weighted):   {weighted_f1 * 100:.2f}%")
    print("-" * 60)
    print(f"{'Threat Category':<20} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 60)
    for name in target_names:
        metrics = evaluation_results["class_wise"].get(name, {})
        p = metrics.get("precision", 0) * 100
        r = metrics.get("recall", 0) * 100
        f1 = metrics.get("f1-score", 0) * 100
        sup = metrics.get("support", 0)
        print(f"{name:<20} | {p:>8.2f}% | {r:>8.2f}% | {f1:>8.2f}% | {sup:>8}")
    print("=" * 60)


if __name__ == "__main__":
    main()
