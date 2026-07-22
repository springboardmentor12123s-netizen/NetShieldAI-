# NetShield AI SOC Platform - Detailed Technical Overview

This document provides a comprehensive breakdown of the NetShield AI Security Operations Center (SOC) platform, detailing its architecture, databases, data ingestion flow, key codebase files, and execution instructions.

---

## 1. Project Conceptual Overview
NetShield AI is a modern threat detection and visualization platform designed to simulate a high-throughput network monitoring system. It processes packet flows and flags anomalies/attacks using Machine Learning.

*   **Intrusion Detection**: Uses historical cybersecurity datasets (**CICIDS2017** and **UNSW-NB15**) containing diverse packet signatures—ranging from normal/benign activities to denial of service (DoS), exploits, fuzzers, and reconnaissance sweeps.
*   **Real-time Alerts**: Relies on WebSockets to stream incoming anomalies directly to a React-based frontend dashboard for SOC analysts.

---

## 2. Directory & Component Architecture

The project is divided into two primary workspaces:

### 📁 Root Directory
*   `requirements.txt`: Root Python dependency definitions file.
*   `Makefile`: Multi-task script shortcut helper (Docker, staging, migrations).
*   `netshield.db`: SQLite database file.
*   `scripts/`: Holds operational script logic (seeding, ML training, traffic generation).

---

### 📂 Backend Service (`/backend`)
Built using **FastAPI** (Python 3.12+), Structured with the following packaging:

*   `app/core/`: Application bootstrapping, setup configs (`config.py`), database engines (`database.py`, `mongodb.py`), security hashing algorithms (`security.py`), and error handler registration.
*   `app/models/`: SQLAlchemy DB mappings (e.g., `user.py`, `role.py`, `permission.py`, `team.py` for Role-Based Access Control).
*   `app/repositories/`: Query layers implementing access patterns (e.g. `traffic_repository.py` for MongoDB querying).
*   `app/api/v1/`: Rest API routers endpoint mappings (e.g. `/auth/login`, `/metrics`, `/traffic`, `/users`).
*   `app/websocket/`: Full-duplex connection routers and alert broadcast pipelines.
*   `app/ai/`: Placeholders, loaders, and serialization for trained Scikit-learn detection models.

---

### 📂 Frontend Service (`/frontend`)
Built using **Next.js** (TailwindCSS, TypeScript, Shadcn UI):

*   `src/app/`: App router page layouts (e.g., dashboard panels, details pages, authorization panels).
*   `src/components/`: Modular widgets block (e.g., interactive line/bar charts, alerts tables, grid containers).
*   `src/providers/`: React Context Hooks wrapping authentication status (`auth-provider.tsx`) and layout theme behaviors.
*   `src/services/`: Client-side Axios networking class layers connecting to FastAPI.

---

## 3. Database Schema Layout

The application separates concerns by combining **Relational (SQLite)** and **NoSQL (MongoDB)** architectures:

```
                  ┌──────────────────────┐
                  │ SQLite Database      │  <-- Internal Systems (SQLAlchemy)
                  │ (netshield.db)       │
                  ├──────────────────────┤
                  │ - Roles & Permissions│
                  │ - User Profiles      │
                  │ - Team Structures    │
                  └──────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ MongoDB Database     │  <-- Telemetry Ingestion (Motor/Pymongo)
                  │ (netshield_traffic)  │
                  ├──────────────────────┤
                  │ - Ingested Packet    │
                  │   Log telemetry      │
                  └──────────────────────┘
```

### Relational Schema (SQLite via SQLAlchemy)
1.  **`users`**: Represents individuals logged into the system. Stores `email` (unique identifier), `full_name`, `hashed_password` (using Bcrypt), and references to `roles` and `teams`.
2.  **`roles`**: Contains RBAC roles (`Admin` and `Analyst`).
3.  **`permissions`**: Contains fine-grained privilege keys (e.g. `traffic:read`, `users:write`, `dashboard:read`).
4.  **`role_permissions`**: Pivot table handling many-to-many relationships matching roles to permissions.

### Document Schema (MongoDB Telemetry)
The `traffic_logs` collection tracks captured packet flows:
*   `timestamp`: Datetime of recorded capture (UTC).
*   `src_ip` / `dst_ip`: IPv4 endpoints.
*   `src_port` / `dst_port`: Protocol ports.
*   `protocol`: String network protocol (`TCP`, `UDP`, `ICMP`).
*   `bytes_sent` / `bytes_received`: Numerical flow volume.
*   `metadata`: Sub-document capturing raw attributes:
    *   `dataset`: Source indicator (`CICIDS2017` or `UNSWNB15`).
    *   `label` (or `attack_category`): String tags classifying the flow (e.g., `"BENIGN"`, `"DoS"`, `"Exploits"`, `"Reconnaissance"`).

---

## 4. Key Files to Run (Operational Guide)

The following scripts and entry points command the platform's behavior:

### A. Initialization & Seeding Scripts
Located in `/scripts/` folder:
1.  **`scripts/load_datasets.py`**:
    *   *Purpose*: Parses the static CSV files in `backend/app/ai/datasets/` and pushes them into your local MongoDB.
2.  **`scripts/seed_db.py`**:
    *   *Purpose*: Builds SQLite tables and seeds them with baseline roles and permissions (Admin/Analyst setup).
3.  **`scripts/create_admin.py`**:
    *   *Purpose*: Builds the main root administrator profile (`admin@netshield.io` / `AdminPassword123!`).

### B. Application Servers
1.  **`backend/app/main.py`**:
    *   *Purpose*: Entry point to launch the FastAPI server. Initiates connection life cycles for MongoDB and SQLite, applies rate limits, and registers API endpoints.
    *   *Run via*: `.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload`
2.  **`frontend/` Development Server**:
    *   *Purpose*: Bundles and compiles Next.js pages. Runs with Webpack configurations to avoid fast-refresh performance bottlenecks.
    *   *Run via*: `cmd.exe /c "npm run dev"` (Starts the client panel at `localhost:3000`).

---

## 5. Network Traffic Data Flow

```
 ┌──────────────────────┐      ┌──────────────────────┐
 │ Sample CSV Telemetry │ ───> │ Load Datasets Script │
 └──────────────────────┘      └──────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │     MongoDB Log      │
                               │      Collection      │
                               └──────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐      ┌──────────────────────┐
                               │  FastAPI Controller  │ <─── │   Next.js FrontEnd   │
                               │   (app/api/v1/...)   │      │   Dashboard Pages    │
                               └──────────────────────┘      └──────────────────────┘
```

1.  **Ingestion**: `load_datasets.py` reads CSV dataset logs and loads them into MongoDB.
2.  **Telemetry Fetching**: Next.js asks `/api/v1/traffic` for logs.
3.  **Inference (ML Prediction)**: The traffic metrics controller processes flows to extract anomaly prediction patterns.
4.  **Display & Alerting**: Real-time alerts are emitted over WebSockets to trigger system threat alarms on the frontend client browser.
