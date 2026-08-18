# NetShield AI — Network Anomaly Detection & Threat Monitoring System

AI-powered platform that continuously monitors network traffic, detects anomalies using an unsupervised machine learning ensemble, classifies the type of attack using a supervised model, computes a composite risk score, and manages the resulting alerts — all through a secure, role-based web dashboard.

## What This Project Does

NetShield AI ingests network flow data (via a synthetic traffic generator, real benchmark datasets, or live packet capture), extracts a consistent set of statistical and behavioral features from it, and runs it through a two-stage machine learning pipeline:

1. **Unsupervised anomaly detection** — an ensemble of Isolation Forest and One-Class SVM flags statistically unusual flows without needing labeled data.
2. **Supervised attack classification** — a Random Forest classifier (with XGBoost as an alternative) predicts the specific attack type for flagged flows (e.g. DDoS, port scan, brute force, data exfiltration, and the finer-grained categories from CICIDS2017 and UNSW-NB15).

These two outputs feed into a **composite risk scoring engine** (0–100, mapped to low/medium/high/critical), and any high or critical detection automatically generates an alert — with email notifications for critical severity.

## Key Features

- **Authentication & RBAC** — JWT-based login, public self-service signup, and an admin-only registration flow for provisioning higher-privilege roles (admin, SOC lead, analyst, viewer).
- **Traffic Monitoring** — synthetic flow generation for demos/testing, plus genuine live packet capture via Scapy/Npcap when run natively (outside Docker) with administrator privileges.
- **Anomaly Detection & Intrusion Prediction** — train on synthetic data, CICIDS2017, UNSW-NB15, or a combined dataset; view live accuracy/precision/recall/F1 metrics per model type.
- **Alert Management** — full lifecycle (open → acknowledged → resolved / false positive), with notes and source tracking (synthetic vs. live capture).
- **Threat Intelligence Reports** — configurable time-window reports covering alert trends, attack-type breakdowns, top attacker/target IPs, and transparent per-model performance.
- **Dockerized Deployment** — full stack (PostgreSQL + FastAPI backend + React frontend) containerized and orchestrated via Docker Compose.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, JWT auth, bcrypt
- **Frontend:** React (Vite), React Router, custom dark-themed SOC console design
- **Machine Learning:** Scikit-learn (Isolation Forest, One-Class SVM, Random Forest), XGBoost, Pandas, NumPy, Joblib
- **Live Capture:** Scapy + Npcap (native host only)
- **Deployment:** Docker, Docker Compose

## What I Built and Debugged (Development Journey)

- Designed and implemented the full system architecture: API gateway, traffic monitoring pipeline, ML analytics pipeline, alert/response layer, and data storage layer.
- Migrated the backend database from SQLite to PostgreSQL and the frontend from static HTML/JS to a full React (Vite) application, including adding a public signup page.
- Built the complete ML pipeline: feature extraction, the anomaly detection ensemble, the attack classifier, and the risk scoring engine — then iteratively expanded the feature set (adding destination-side packet/byte counts, port-range buckets, and protocol one-hot encoding) to meaningfully improve detection quality.
- Integrated the CICIDS2017 and UNSW-NB15 benchmark datasets, and diagnosed/fixed several real data-quality bugs along the way: a sampling bug that silently read only the first rows of a file instead of a true random sample, a column-name collision between UNSW-NB15's binary and categorical label columns, inconsistent numeric/string protocol codes, and infinite values from zero-duration flows.
- Built alert management with full status lifecycle, email notifications for critical alerts, and a threat intelligence reporting page using efficient SQL-level aggregation.
- Fixed a subtle "ambiguous latest model" bug where the reporting page could silently display metrics from the wrong model type or an unintended stale training run, by making both the ensemble's and classifier's latest results explicit and separately labeled.
- Containerized the full stack with Docker and Docker Compose, and resolved deployment-specific issues including a dependency-hash mismatch, a missing ML package causing container crash loops, and a memory-safety issue where loading a large merged CICIDS2017 file could exhaust container memory — solved with a chunked, memory-bounded sampling strategy.
- Implemented live packet capture with Scapy/Npcap, including auto-detection of the correct network interface on Windows (since Npcap exposes interfaces by internal GUID rather than friendly name), and documented — both in code and in the UI — the architectural limitation that live capture cannot see real host traffic when the backend runs inside a Docker container.

## Project Structure
netshield-ai/
├── backend/ # FastAPI app, ML pipeline, routers, models
├── frontend/ # React (Vite) SOC console
├── docker-compose.yml # Postgres + backend + frontend orchestration
└── README.md


## Running the Project

**How to Run**

**Backend**

 cd C:\Users\HP\Downloads\netshield-ai\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000

**Frontend**

 cd C:\Users\HP\Downloads\netshield-ai\frontend
 npm run dev

Open browser at http://localhost:5500

See the setup instructions further down this README for both the local (native Python/Node) and Docker Compose deployment paths, including default demo credentials.
