# Dashboard Performance Baseline Report

This report presents the baseline performance measurements of the NetShield AI SOC Platform dashboard APIs before implementing responsiveness optimizations.

## Measurement Environment
- **Backend Host:** Local Uvicorn Server (http://127.0.0.1:8000)
- **Frontend Host:** Local Next.js Server (http://localhost:3000)
- **Database:** SQLite (local file) & MongoDB (collection traffic_logs)
- **Trails Per Endpoint:** 10 trials

## Baseline Metrics Table

| Endpoint Name | HTTP Route | Avg Latency (ms) | Min Latency (ms) | Max Latency (ms) | Payload Size (Bytes) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Operations: Stats** | `/traffic/stats` | 32.64 | 14.63 | 166.28 | 338 B |
| **Operations: Analytics** | `/traffic/analytics` | 39.22 | 35.92 | 45.93 | 4,044 B |
| **Network Monitor: Logs** | `/traffic` | 24.95 | 21.11 | 36.69 | 3,077 B |
| **AI Detection: ML Status** | `/traffic/ml/status` | 488.96 | 5.00 | 4,831.41 | 408 B |
| **AI Detection: ML Eval** | `/traffic/ml/evaluation`| 9.24 | 7.60 | 11.17 | 1,519 B |
| **AI Detection: Confusion** | `/traffic/ml/confusion-matrix` | 14.13 | 8.61 | 27.95 | 88,620 B |

## Key Bottlenecks Identified

1. **ML Model Lazy Loading Delay**
   - The `/traffic/ml/status` endpoint has an average latency of **488.96 ms**, but its maximum latency reaches **4,831.41 ms** (4.83 seconds). This occurs because the threat classification models are loaded from disk (`joblib.load`) on the very first request to the endpoint.
   - **Solution:** Pre-load the ML models asynchronously or at startup during the FastAPI `lifespan` stage.

2. **Blocking Operations Dashboard Feed**
   - The React state in `dashboard/page.tsx` blocks the entire overview grid because it uses a unified loading state `isLoading = statsLoading || analyticsLoading`. Due to this, simple stat cards (which load in ~30ms) are blocked by the slower analytics data rendering.
   - **Solution:** Decouple these loading states using independent skeleton loaders.

3. **Potential Duplicate API Requests**
   - The frontend queries in `hooks/use-traffic.ts` have very low `staleTime` values (e.g. 5 seconds for stats and logs), leading to frequent re-fetching when users navigate between tabs design.
   - **Solution:** Increase the `staleTime` and align them with the tab switching/refresh rate.
