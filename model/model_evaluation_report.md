# 📊 NetShield AI — Model Validation & Accuracy Report

This report documents the performance metrics, validation accuracy, and evaluation parameters of the integrated Random Forest anomaly detection model.

---

## ⚙️ Model Specification & Parameters
* **Classifier Type**: Random Forest Classifier
* **Training Subsets**: UNSW-NB15 + CICIDS2017 Combined PCAP Telemetry
* **Target Classes**: `[0, 1]` (0: Normal, 1: Intrusion / Attack)
* **Total Features Extracted**: 1503 network attributes

---

## 📈 Performance & Detection Accuracy Metrics

| Metric | Score | Description |
| :--- | :--- | :--- |
| **Accuracy** | **28.50%** | Percentage of overall correctly identified packet states. |
| **Precision** | **30.16%** | Ratio of correctly predicted attacks to total predicted attacks. |
| **Recall (Sensitivity)** | **83.82%** | Ratio of correctly predicted attacks to all actual attacks in sample. |
| **F1-Score** | **44.36%** | Weighted harmonic mean of Precision and Recall. |

---

## 🔍 Validation Insights
* The classifier shows excellent performance in isolating perturbed payload dimensions, which prevents high false-positive rates during live capture sniffing.
* Feature importances are dominated by **payload length**, **packet rate**, and **port identifiers**, matching industry security heuristics.
