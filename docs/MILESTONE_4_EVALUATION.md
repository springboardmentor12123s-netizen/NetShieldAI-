# NetShield AI - ML Model Validation & Evaluation (Milestone 4)

This document contains the evaluation details, testing methodology, metrics, and interpretation of performance for the NetShield AI machine learning threat detection engine.

---

## 1. Model & Dataset Profiles

- **Model Tested:** 
  1. **Threat Classifier:** Multi-class Random Forest Classifier wrapper loaded from `backend/app/ai/models/saved/threat_classifier.joblib`.
  2. **Anomaly Detector:** Unsupervised Isolation Forest model loaded from `backend/app/ai/models/saved/anomaly_detector.joblib`.
- **Dataset Used:** CIC-IDS-2017 Dataset.
- **Segment Analyzed:** Validation test samples split with `test_size=0.25`, `random_state=42`, stratified by threat labels.
- **Evaluation Size:** 49,998 network traffic samples.

---

## 2. Evaluation Methodology

1. **Preprocessing Integration:**
   Identical scaler parameters (`preprocessor.joblib` fitted during model training) were loaded. Features were scaled without refitting to ensure no data leakage. 
2. **Prediction Pipeline:**
   Validation features were parsed and passed to:
   - The Random Forest Classifier to categorize flows into threat types (Normal, DDoS, DoS, PortScan, Brute Force, Bot, etc.).
   - The Isolation Forest Detector to label flows as normal vs. anomalous behavior.
3. **Metric Calculations:**
   Standard metrics was calculated:
   - $\text{Accuracy} = \frac{\text{Correct Predictions}}{\text{Total Predictions}}$
   - $\text{Precision} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}}$ (by class and weighted/macro avg)
   - $\text{Recall} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}}$ (by class and weighted/macro avg)
   - $\text{F1-Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$ (by class and weighted/macro avg)
   - **Confusion Matrix:** Counts distribution matching True categories against Predicted categories.

---

## 3. Metric Results Summary

### Global Performance
- **Classifier Accuracy:** 99.81%
- **Weighted Precision:** 99.84%
- **Weighted Recall:** 99.81%
- **Weighted F1-Score:** 99.82%

### Threat Category Breakdown

| Threat Category | Precision | Recall | F1-Score | Tested Samples |
| :--- | :---: | :---: | :---: | :---: |
| **Normal** | 99.93% | 99.84% | 99.89% | 40,150 |
| **PortScan** | 99.47% | 99.86% | 99.66% | 2,807 |
| **DDoS** | 99.96% | 99.82% | 99.89% | 2,261 |
| **DoS** | 99.53% | 99.80% | 99.66% | 4,462 |
| **Brute Force** | 100.00% | 99.18% | 99.59% | 244 |
| **Bot** | 48.21% | 77.14% | 59.34% | 35 |
| **Other Threat** | 100.00% | 94.87% | 97.37% | 39 |

---

## 4. Interpretation of Results

- **Benign Traffic Reliability:** The Random Forest Classifier shows an extremely high accuracy on benign network traffic (99.93% precision, 99.84% recall). This ensures false positives on normal traffic are near-zero.
- **PortScan & DDoS/DoS Identifications:** Classifier scores (F1 > 99.6% across high-volume attacks) showing outstanding learning stability on DDoS reflows and PortScan protocols.
- **Underrepresented Threats (Bots):** The classifier exhibits a lower F1-score (59.34%) for the "Bot" class. This is caused by the extreme class imbalance in the training split. With only 35 test samples for the Bot category, minor predictive mismatches lead to lower precision.

---

## 5. Identified Limitations & Recommendations

1. **Extreme Class Imbalance:** Minor attack categories (e.g. Bot, Heartbleed, Infiltration) are underrepresented in the CIC-IDS dataset. We recommend implementing oversampling techniques (such as SMOTE) or applying higher class weights for threat classes in future training runs.
2. **Static Preprocessing:** Real-world traffic feature extraction requires active window accumulation (moving average packet counts, etc.). We suggest adding a stream feature aggregator to translate live raw packets into standard flow profiles.
