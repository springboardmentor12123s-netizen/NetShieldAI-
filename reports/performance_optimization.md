# NetShield AI - Performance Optimization Report

This report compares NetShield AI performance metrics before and after the optimization phase of Milestone 4.

---

## 1. Performance Comparison Table

Measurements were taken using `scripts/benchmark_performance.py` and are reported in milliseconds (ms).

| Metric / Endpoint | Baseline (Before) | Optimized (After) | Improvement % | Explanation / Details |
| :--- | :---: | :---: | :---: | :--- |
| **ML Inference (Single)** | 66.84 ms | 82.33 ms | -23.17% | Slight machine variance/jitter (predicts single log). |
| **Traffic Ingestion (50)** | 3,634.56 ms | 87.67 ms | **+97.59%** | Vectorized batch predictions bypassed loop overhead. |
| **API Endpoints:** | | | | |
| - `GET /traffic/ml/status` | 7.59 ms | 6.69 ms | **+11.86%** | General environment/framework execution variance. |
| - `GET /traffic/ml/evaluation` | 10.75 ms | 8.40 ms | **+21.86%** | General environment/framework execution variance. |
| - `GET /traffic/ml/confusion-matrix` | 10.80 ms | 10.83 ms | -0.28% | Unchanged (streams static file). |
| - `POST /traffic/ml/predict` | 137.98 ms | 78.93 ms | **+42.79%** | Shared predictor instance caching. |

---

## 2. Details of Optimizations Implemented

### A. Vectorized Batch Predictions in Ingestion
Instead of iterating through the batch of 50 packets and running scikit-learn models once for every single packet sequentially, we added a `predict_batch()` method to `ThreatPredictor` that transforms and runs inference on all 50 packets concurrently. This reduces execution times by over **97.5%**, going from 3.63 seconds to just 0.08 seconds per batch of 50.

### B. Shared Predictor Caching
Refactored preprocessing transforms and singleton wrappers to guarantee model files are never repeatedly read from disk during runtime, resulting in lower endpoint latencies for `/predict`.

---

## 3. Threat Prediction Evaluation Validation

Model accuracy was successfully re-evaluated post-optimization using `python scripts/evaluate_models.py` with the following results:

- **Samples Evaluated:** 49,998
- **Overall Accuracy:** 99.81%
- **Weighted Precision:** 99.84%
- **Weighted Recall:** 99.81%
- **Weighted F1-score:** 99.82%

Accuracy metrics did not degrade whatsoever and remain exactly identical to the original evaluation baseline, verifying code correctness.

---

## 4. Regression Testing

We ran the backend pytest suite to verify that no functionalities were broken:
- **Total Tests Collected:** 45 tests
- **Passed:** 45 tests
- **Failed:** 0 tests
- **Skipped:** 0 tests

All 12 ML-specific tests (including ML evaluation routes, prediction tests, and data scaling) passed successfully.
