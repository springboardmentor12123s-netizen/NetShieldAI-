# 🛡️ NetShield AI – Network Anomaly Detection & Threat Monitoring System

An AI-powered cybersecurity monitoring system that detects anomalous network traffic using Machine Learning.

NetShield AI enables security analysts to upload network traffic datasets, train anomaly detection models, predict suspicious traffic, classify cyber threats, generate risk scores, create security alerts, and monitor threat analytics through an interactive dashboard.

> **Status:** Milestone 1 ✅ Completed | Milestone 2 ✅ Completed

---

# 📌 Table of Contents

- Overview
- Features
- Tech Stack
- Project Architecture
- Milestone Progress
- Machine Learning Pipeline
- Threat Classification
- Risk Scoring
- RBAC
- Dataset
- Project Structure
- API Endpoints
- Installation
- Running the Project
- Screenshots
- Future Scope
- Limitations
- Contributors

---

# 🚀 Overview

NetShield AI simulates a simplified Security Operations Center (SOC) workflow by combining:

- Machine Learning
- Network Traffic Analysis
- Threat Monitoring
- Dashboard Analytics
- Alert Generation
- PostgreSQL Database
- FastAPI REST APIs
- React Frontend

The application analyzes uploaded CSV network traffic datasets (CICIDS2017 format) and identifies suspicious network activities using an Isolation Forest anomaly detection model.

---

# ✨ Features

## Authentication

- Login system
- Role-Based Access Control (RBAC)

## Dashboard

- Security overview
- Threat statistics
- Alerts summary
- Prediction analytics

## Dataset Management

- Upload CSV datasets
- Dataset preview
- Data validation

## Machine Learning

- Train Isolation Forest model
- Save trained model
- Model evaluation
- Prediction workflow

## Threat Detection

- Anomaly detection
- Threat classification
- Risk scoring
- Severity generation

## Reporting

- Alerts
- Prediction history
- Threat reports

## Documentation

- FastAPI Swagger UI

---

# 🛠 Tech Stack

## Frontend

- React + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- lucide-react
- react-hot-toast

---

## Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pandas
- NumPy
- Scikit-learn
- Joblib
- python-dotenv

---

## Machine Learning

- Isolation Forest

---

# 🏗 Project Architecture

```
                 React Dashboard
                        │
                        │
                  REST API (FastAPI)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
 Authentication    ML Service     PostgreSQL
        │               │               │
        │         Isolation Forest      │
        │               │               │
        └────── Upload / Prediction ────┘
```

---

# ✅ Milestone Progress

## Milestone 1 – Project Initialization & Core Setup

Completed:

- Security monitoring workflow
- System architecture
- Database schema
- React frontend
- FastAPI backend
- Authentication
- RBAC
- Dataset upload
- Dashboard analytics
- Model training
- Prediction workflow
- Alerts module
- History tracking
- Frontend–Backend integration

---

## Milestone 2 – Anomaly Detection & Intrusion Prediction

Completed:

- Isolation Forest model
- Model evaluation
- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix
- Threat classification
- Risk scoring
- Severity generation
- Threat reports
- PostgreSQL integration

---

# 🤖 Machine Learning Pipeline

## Training

```
Upload CSV
      │
      ▼
Data Cleaning
      │
      ▼
Feature Selection
      │
      ▼
Feature Scaling
      │
      ▼
Isolation Forest Training
      │
      ▼
Save Model
      │
      ▼
Evaluation Metrics
```

---

## Prediction

```
Prediction CSV
      │
      ▼
Load Trained Model
      │
      ▼
Predict Anomalies
      │
      ▼
Generate Risk Score
      │
      ▼
Assign Severity
      │
      ▼
Threat Classification
      │
      ▼
Store Alerts & History
```

---

# 🎯 Threat Classification

| Condition | Threat |
|-----------|--------|
| High Bytes/s + High Packets/s | Possible DDoS |
| Port 22 | Possible SSH Attack |
| Port 80 / 443 | Possible Web Attack |
| Port 53 | Possible DNS Attack |
| Other Anomaly | Generic Network Anomaly |
| Normal Record | Normal Traffic |

---

# ⚠ Risk Scoring

| Risk Score | Severity |
|------------|----------|
| 0–30 | 🟢 Low |
| 31–60 | 🟡 Medium |
| 61–80 | 🟠 High |
| 81–100 | 🔴 Critical |

---

# 👥 Role-Based Access Control

## Demo Users

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Analyst | analyst | analyst123 |
| Viewer | viewer | viewer123 |

---

## Permissions

| Feature | Admin | Analyst | Viewer |
|----------|:----:|:-------:|:------:|
| Dashboard | ✅ | ✅ | ✅ |
| Upload Dataset | ✅ | ✅ | ❌ |
| Train Model | ✅ | ✅ | ❌ |
| Prediction | ✅ | ✅ | ❌ |
| Alerts | ✅ | ✅ | ✅ |
| History | ✅ | ✅ | ✅ |
| Threat Reports | ✅ | ✅ | ✅ |

---

# 📂 Supported Dataset

The system currently supports **CICIDS2017-style CSV datasets**.

Example features:

```
Destination Port
Flow Duration
Total Fwd Packets
Total Backward Packets
Flow Bytes/s
Flow Packets/s
Packet Length Mean
Average Packet Size
Label
```

Labels:

```
BENIGN
DDoS
Bot
DoS
PortScan
SSH
Web Attack
```

Any label other than **BENIGN** is treated as malicious traffic.

---

# 📁 Project Structure

```
NetShieldAI
│
├── backend
│   ├── app
│   │   ├── models
│   │   ├── routers
│   │   ├── schemas
│   │   ├── services
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── uploads
│   ├── predictions
│   ├── saved_models
│   ├── .env.example
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── sample_data
├── scripts
├── README.md
└── .gitignore
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Health Check |
| POST | `/api/login` | Login |
| POST | `/api/upload` | Upload Dataset |
| POST | `/api/train` | Train Model |
| POST | `/api/predict` | Predict Anomalies |
| GET | `/api/dashboard` | Dashboard |
| GET | `/api/alerts` | Alerts |
| GET | `/api/history` | Prediction History |
| GET | `/api/reports/latest` | Latest Threat Report |

---

# 📖 API Documentation

FastAPI automatically generates API documentation.

```
http://127.0.0.1:8765/docs
```

---

# 💾 PostgreSQL Setup

Create database:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE netshield_ai;"
```

Create `.env`

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/netshield_ai
```

---

# ⚙ Backend Setup

```powershell
cd backend

python -m venv .venv

.\.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8765
```

Backend:

```
http://127.0.0.1:8765
```

---

# 💻 Frontend Setup

```powershell
cd frontend

npm install

npm run dev
```

Frontend:

```
http://127.0.0.1:5173/login
```

---

# ▶ Running the Project

Open **two terminals**.

### Terminal 1

```powershell
cd backend

uvicorn app.main:app --reload --port 8765
```

### Terminal 2

```powershell
cd frontend

npm run dev
```

---

# 📸 Screenshots

Add screenshots here.

```
Login Page

Dashboard

Dataset Upload

Model Training

Prediction

Threat Report

Alerts

History
```

---

# 🚫 Files Not to Push

```
backend/.env

backend/.venv/

frontend/node_modules/

backend/uploads/

backend/predictions/

backend/saved_models/

__pycache__/

*.db

Large datasets
```

---

# 📤 Files to Push

```
backend/app/

frontend/src/

sample_data/

scripts/

README.md

requirements.txt

package.json

package-lock.json

.gitignore

.env.example
```

---

# ⚠ Limitations

- Dataset-based detection only
- No live packet capture
- No Wireshark integration
- No Zeek integration
- No SIEM integration
- Local deployment only
- Simplified authentication
- CSV-based workflow

---

# 🚀 Future Scope

- Live packet capture
- Deep Learning models
- XGBoost / Random Forest
- Password hashing
- JWT Authentication
- User management
- Email alerts
- SMS alerts
- Report export (PDF)
- Alembic database migrations
- Docker support
- Cloud deployment
- SIEM integration
- Zeek integration
- Wireshark integration

---

# 👨‍💻 Contributors

**Project:** NetShield AI – Network Anomaly Detection & Threat Monitoring System

Developed as a Final Year Cybersecurity & Machine Learning academic project.

---

# 📄 License

This project is intended for **educational and research purposes only**.