# NetShield AI - Performance Baseline Report

This report documents the performance measurements of NetShield AI's machine learning, database, and API layers prior to applying optimizations.

---

## 1. Measurement Parameters

- **Test Machine Platform:** Windows
- **Sample Ingestion Batch Size:** 50 entries
- **FastAPI Routing Framework:** In-process TestClient execution
- **Model Framework:** Scikit-learn (IsolationForest, RandomForestClassifier)
- **Data Ingestion Target:** Async MongoDB (Motor)

---

## 2. Performance Baseline Scores

The measurements below were captured using `scripts/benchmark_performance.py` on 2026-08-11:

| Operation / Endpoint | Average Latency | Minimum Latency | Maximum Latency |
| :--- | :---: | :---: | :---: |
| **ML Inference (Single Packet)** | 66.84 ms | 56.98 ms | 204.84 ms |
| **Traffic Ingestion (Batch of 50)** | 3,634.56 ms | 3,194.90 ms | 4,281.34 ms |
| **API Endpoints:** | | | |
| - `GET /traffic/ml/status` | 7.59 ms | 5.82 ms | 21.66 ms |
| - `GET /traffic/ml/evaluation` | 10.75 ms | 6.58 ms | 31.38 ms |
| - `GET /traffic/ml/confusion-matrix` | 10.80 ms | 9.02 ms | 16.20 ms |
| - `POST /traffic/ml/predict` | 137.98 ms | 93.53 ms | 343.97 ms |

---

## 3. Bottleneck Analysis

### A. Sequential Prediction Loop in Ingestion
During traffic ingestion, the service loops through each incoming packet sequentially and makes individual calls to `predictor.predict_log()`. This adds significant looping and scaling overhead in python and prevents scikit-learn from utilizing vectors. Vectorizing the preprocessor and running model inference in batches will significantly reduce ingestion time.

### B. High Predict Route Latency
The `/predict` endpoint latency is high (~138 ms) since it instantiates the models and processes single packets. Implementing caching and optimizing vector transforms will help lower latency.
