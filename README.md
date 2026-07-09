# NetShield AI

NetShield AI is a local, full-stack network anomaly detection application built for a final-year college project. It trains an Isolation Forest on CICIDS2017-compatible CSV data, detects anomalous traffic, stores activity in SQLite, and presents results in a responsive monitoring dashboard.

## Features

- Hardcoded local administrator login (`admin` / `admin123`)
- CSV validation, local storage, and 20-row preview
- Isolation Forest training with scaling and Joblib persistence
- Accuracy, precision, recall, F1 score, and confusion matrix
- CSV prediction, anomaly highlighting, and result download
- Severity-based alerts, history, summary cards, and Recharts visualizations
- Automatic SQLite table creation

> The login is intentionally simple and is not suitable for an internet-facing deployment.

## Technology

- Frontend: React 19, Vite, Tailwind CSS, React Router, Axios, Recharts
- Backend: FastAPI, SQLAlchemy, SQLite, Pandas, NumPy, scikit-learn, Joblib
- Dataset: CICIDS2017 CSV files or any compatible numeric CSV

## Folder structure

```text
netshield-ai/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy entities
│   │   ├── routers/      # API route modules
│   │   ├── schemas/      # Request schemas
│   │   ├── services/     # CSV and ML logic
│   │   ├── database.py
│   │   └── main.py
│   ├── uploads/
│   ├── saved_models/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
├── scripts/
│   └── generate_sample_data.py
└── README.md
```

## Installation

Prerequisites: Python 3.10 or newer and Node.js 18 or newer.

### Backend

```powershell
cd netshield-ai\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend

Open a second terminal:

```powershell
cd netshield-ai\frontend
npm install
```

Environment files are optional for the default ports. To customize them, copy `backend/.env.example` and `frontend/.env.example` to `.env` in their respective folders.

## Running the application

Start the backend from `netshield-ai/backend`:

```powershell
uvicorn app.main:app --reload --port 8000
```

Start the frontend from `netshield-ai/frontend`:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), then log in with:

- Username: `admin`
- Password: `admin123`

FastAPI's interactive documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/login` | Validate local administrator credentials |
| POST | `/upload` | Validate, save, and preview a training CSV |
| POST | `/train` | Train on the latest upload, or pass `dataset_id` |
| POST | `/predict` | Analyze an uploaded CSV |
| GET | `/predictions/{id}/download` | Download prediction results |
| GET | `/dashboard` | Retrieve cards and chart data |
| GET | `/alerts` | Retrieve anomaly-only rows |
| GET | `/history` | Retrieve dataset activity |
| GET | `/health` | Backend health check |

The same application endpoints are also available under `/api`; the React client uses these namespaced aliases.

## Training the model

1. Download the CICIDS2017 CSV data or generate the included synthetic demo files:

   ```powershell
   cd netshield-ai
   python scripts\generate_sample_data.py
   ```

2. Open **Upload Dataset** and upload a training CSV.
3. Open **Train Model** and select **Start training**.
4. The latest training upload is cleaned, numeric columns are selected, values are scaled, and an Isolation Forest is saved to `backend/saved_models/isolation_forest.joblib`.

When a `Label`, `Class`, `Target`, `Attack`, or `Category` column exists, metrics compare predictions against its labels (`BENIGN`, `NORMAL`, `0`, and `false` are treated as normal). For unlabeled data, the app evaluates against a robust statistical anomaly baseline.

## Making predictions

1. Train a model first.
2. Open **Prediction** and upload a CSV containing the same numeric feature columns as the training data.
3. The application appends a `Prediction` column containing `Normal` or `Anomaly`.
4. Review the first 20 results and download the complete prediction CSV.
5. Open **Alerts** to view only anomalies. Severity is assigned per prediction run:
   - 1 anomaly: Low
   - 2–5 anomalies: Medium
   - More than 5 anomalies: High

## Notes

- Uploaded data, the SQLite database, and the trained model remain local.
- The upload limit is 50 MB to keep this simplified project responsive.
- CICIDS2017 CSV exports sometimes contain leading spaces in column names; NetShield preserves data while normalizing column names in API previews.
