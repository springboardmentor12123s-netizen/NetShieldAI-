# NetShieldAI - AI Network Anomaly Detection & SOC Threat Monitoring

NetShieldAI is a full-stack **Security Operations Center (SOC)** platform that detects, classifies, and visualizes network anomalies in real time. It combines a **FastAPI + SQLite + MongoDB** backend with a **React + Vite** dashboard, and uses production-trained **scikit-learn** machine learning models (Isolation Forest + Random Forest) trained on the **UNSW-NB15** and **CICIDS2017** datasets.

---

## Project Status

- **Milestone 2** - Core SOC dashboard with real-time monitoring completed.
- **Milestone 3** - ML model training, real-time Wi-Fi packet sniffer, and enhanced frontend completed.
- Trained AI models on a clean, balanced 10,000-record sample (2,500 normal + 2,500 attack per dataset).
- **Current focus:** Increasing dataset utilization for model training and expanding threat-detection coverage.

---

## Key Features

### Authentication & Role-Based Access
- JWT-based authentication (2-hour expiring tokens) via `bcrypt` password hashing.
- Pre-seeded role-based users: **Admin**, **Analyst**, and **Auditor**.
- Registration endpoint for adding new users.

### AI-Driven Detection & Classification
- **Anomaly Detection** - Isolation Forest flags suspicious traffic and returns an anomaly score.
- **Attack Classification** - Random Forest classifies attacks (e.g., DDoS, PortScan, Brute Force, Web Attack) with confidence percentages and per-class probabilities.
- Live packet feature extraction (TTL, total length, protocol, payload bytes) feeds the models in real time.

### Real-Time Wi-Fi Packet Sniffer (Scapy)
- Captures live packets on the Wi-Fi/Ethernet interface.
- Extracts features and runs real-time inference; auto-labels attacks (`Web Attack`, `SSH Brute Force`, `DDoS Flood`, `PortScan`, etc.).
- Automatically creates **Alerts** and **Incidents** in the database when a threat is detected.
- Start / stop / status / reset control endpoints.

### SOC Dashboard & Analytics
- Live traffic visualization, protocol distribution, hourly trends, and severity distribution.
- Dashboard stats: packets processed, alerts triggered, active incidents, MongoDB packet records, CPU/RAM usage, and anomaly rate.
- Database-backed **incident management** (open/close, assign).
- **Threat Intelligence** summary with top threat sources and attack-category breakdown.
- **CSV report export** of all alerts/threats.

### PCAP Analyzer
- Upload `.pcap` files for offline analysis.
- Parses and stores PCAP metadata into MongoDB.

### Hybrid Data Storage
- **SQLite** (relational): users, alerts, incidents.
- **MongoDB** (NoSQL): packet records and PCAP telemetry (with automatic in-memory mock fallback if MongoDB is unavailable).

---

## System Architecture

```
+----------------------------------------------------------+
|                    React + Vite Frontend                |
|   SOC Dashboard + AI Detection + Alerts + Traffic +     |
|   Threat Intel + Incidents + Task Tracker + PCAP        |
+----------------------------+----------------------------+
                             |  REST API (JWT)
+----------------------------v----------------------------+
|                    FastAPI Backend                      |
|  auth.py  +  routes.py  +  main.py  +  database.py      |
|  models.py  +  packet_sniffer.py  +  train_model.py     |
+----------------+---------------------------+-----------+
                 |                           |
      +----------v---------+      +----------v-----------+
      |   SQLite (SQLAlchemy)|     |  MongoDB (NoSQL)   |
      |  users + alerts +   |     |  packets + meta     |
      |  incidents           |     |  (mock fallback)   |
      +-----------------------+     +--------------------+
                 |
      +----------v---------+
      |  ML Models (.pkl)  |
      |  Isolation Forest  |
      |  Random Forest     |
      |  Scaler/Encoder    |
      +--------------------+
```

---

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| **Frontend**| React 19, Vite 8, Oxlint |
| **Backend** | Python, FastAPI, Uvicorn |
| **ML**      | scikit-learn, NumPy, Pandas |
| **Databases**| SQLite (SQLAlchemy), MongoDB (PyMongo) |
| **Auth**    | PyJWT, bcrypt |
| **Networking** | Scapy |

---

## Project Structure

```
NetShieldAI/
├── backend/
│   ├── main.py            # FastAPI app entry point, CORS, user seeding
│   ├── routes.py          # All REST API endpoints
│   ├── auth.py            # JWT register/login + token verification
│   ├── database.py        # SQLite + MongoDB setup (mock fallback)
│   ├── models.py          # SQLAlchemy models (User, Alert, Incident)
│   ├── packet_sniffer.py  # Scapy live Wi-Fi packet capture & inference
│   ├── train_model.py     # ML model training pipeline
│   ├── requirements.txt   # Python dependencies
│   └── models/            # Trained .pkl model artifacts
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Routing/navigation shell
│   │   └── components/    # Dashboard, Alerts, Incidents, Pcap, etc.
│   └── package.json
├── dataset/               # UNSW-NB15 & CICIDS2017 CSVs (gitignored)
├── model/                 # Notebooks & refined model artifacts
└── scratch/               # Testing scripts
```

---

## Getting Started

### 1. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# (Optional) Train the ML models on your dataset
python -m backend.train_model

# Start the API server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will launch the dashboard (default: `http://localhost:5173`).

### 3. Default Login Credentials

On first startup, the backend seeds these users:

| Username | Password   | Role    |
|----------|------------|---------|
| `admin`  | `admin123` | Admin   |
| `analyst`| `analyst123`| Analyst |
| `auditor`| `auditor123`| Auditor |

---

## API Endpoints

### Auth
| Method | Endpoint        | Description |
|--------|-----------------|-------------|
| POST   | `/auth/register`| Register a new user |
| POST   | `/auth/login`   | Login, returns JWT + role |

### Dashboard & Monitoring
| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| GET    | `/dashboard/stats`           | Overall SOC stats |
| GET    | `/monitoring/traffic`        | Simulated live traffic feed |
| GET    | `/monitoring/analytics`      | Traffic analytics & trends |
| POST   | `/monitoring/reset`          | Reset all telemetry & logs |
| GET    | `/dataset/sample`            | Sample rows from datasets |
| GET    | `/dataset/stats`             | Dataset row counts & sizes |

### AI Detection
| Method | Endpoint             | Description |
|--------|----------------------|-------------|
| POST   | `/ai/detect`         | Anomaly detection (Isolation Forest) |
| POST   | `/ai/classify`       | Attack classification (Random Forest) |
| GET    | `/ai/model-info`     | Model metadata & feature count |

### Packet Sniffer
| Method | Endpoint                       | Description |
|--------|--------------------------------|-------------|
| POST   | `/monitoring/sniffer/start`    | Start live capture |
| POST   | `/monitoring/sniffer/stop`     | Stop live capture |
| GET    | `/monitoring/sniffer/status`   | Sniffer status & counters |

### Alerts & Incidents
| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| GET    | `/alerts`                    | List all alerts |
| POST   | `/alerts`                    | Create an alert |
| GET    | `/incidents`                 | List all incidents |
| PUT    | `/incidents/{id}`            | Update incident (assign/status) |
| GET    | `/users/list`                | List usernames |

### PCAP & Reports
| Method | Endpoint                     | Description |
|--------|------------------------------|-------------|
| POST   | `/pcap/upload`               | Upload a PCAP file |
| GET    | `/reports/export`            | Export alerts as CSV |
| GET    | `/reports/threat-intel`      | Threat intelligence summary |

---

## Machine Learning Models

### Training Pipeline (`train_model.py`)
1. Loads up to **50,000 rows** from each of the UNSW-NB15 and CICIDS2017 datasets.
2. Builds a **balanced 10,000-record sample** (2,500 normal + 2,500 attack per dataset).
3. Cleans features, maps protocols, and drops non-numeric columns.
4. Trains two models on a stratified 80/20 train/test split:
   - **Isolation Forest** for anomaly detection.
   - **Random Forest Classifier** (regularized) for attack-type classification.
5. Saves artifacts to `backend/models/`.

### Model Artifacts (`backend/models/`)
| File                   | Purpose                          |
|------------------------|----------------------------------|
| `isolation_forest.pkl` | Anomaly detection model          |
| `random_forest.pkl`    | Attack classification model      |
| `scaler.pkl`           | StandardScaler for features      |
| `label_encoder.pkl`    | Category label encoder           |
| `feature_columns.pkl`  | Expected feature column order    |
| `attack_classes.pkl`   | List of attack class labels      |

---

## Dataset Source

- [UNSW-NB15 & CICIDS2017 labelled PCAP data (Kaggle)](https://www.kaggle.com/datasets/yasiralifarrukh/unsw-and-cicids2017-labelled-pcap-data)

**Note:** The `dataset/` folder is git-ignored (large files). Download the CSVs locally and place them at `dataset/Payload_data_UNSW.csv` and `dataset/Payload_data_CICIDS2017.csv` before training.

---

## Troubleshooting & Notes

- **MongoDB not running?** The backend automatically falls back to an in-memory mock store, so the app still works end-to-end.
- **Scapy not installed / no admin rights?** The sniffer endpoints return a clear error; the rest of the dashboard continues to function using simulated traffic.
- **Models not trained?** The `/ai/*` endpoints return a `503` with instructions to run `python -m backend.train_model`.
- **Live sniffer requires admin/root privileges** to capture raw packets on most systems.
