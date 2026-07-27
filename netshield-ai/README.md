# NetShield AI

An AI-powered Network Intrusion Detection and Threat Monitoring System.
FastAPI + MongoDB backend, scikit-learn intrusion-detection model, React dashboard.
No Docker required — everything runs with plain Python and Node.

```
netshield-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              <- FastAPI entrypoint
│   │   ├── config.py            <- reads .env
│   │   ├── database.py          <- ★ MongoDB connection lives here
│   │   ├── auth.py              <- JWT login/password hashing
│   │   ├── models.py            <- request/response schemas
│   │   ├── routers/             <- API endpoints (auth, dashboard, predict, alerts, analytics)
│   │   ├── ml/
│   │   │   ├── generate_dataset.py  <- ★ makes a synthetic dataset (or plug in your own)
│   │   │   ├── train_model.py       <- trains the RandomForest intrusion detector
│   │   │   └── model.py             <- loads model.pkl for live predictions
│   │   └── data/
│   │       └── network_traffic.csv  <- ★ YOUR DATASET GOES HERE
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/       <- Login, Register, Dashboard, Analytics, Alerts
    │   ├── components/  <- Navbar
    │   └── api.js        <- talks to the backend at /api
    └── package.json
```

## 1. Where to put the dataset

**File:** `backend/app/data/network_traffic.csv`
**Controlled by:** `DATASET_PATH` in `backend/.env`

You have two options:

- **Use your own dataset** (NSL-KDD, CICIDS2017, UNSW-NB15, or your own captured
  traffic). Drop the CSV at that path. It needs a `label` column (e.g. `normal`,
  `ddos`, `portscan`, ...) plus the feature columns listed at the top of
  `backend/app/ml/train_model.py` (`duration`, `protocol_type`, `src_bytes`,
  `dst_bytes`, `packet_count`, `flow_rate`, `wrong_fragment`, `urgent`, `count`,
  `srv_count`). If your column names differ, edit `NUMERIC_FEATURES` /
  `CATEGORICAL_FEATURES` / `LABEL_COLUMN` at the top of that file to match.

- **No dataset yet?** Run the generator and it creates a realistic synthetic
  one for you (normal + DDoS + PortScan + BruteForce + Botnet traffic):
  ```bash
  cd backend
  python -m app.ml.generate_dataset
  ```

## 2. Where MongoDB is connected

**File:** `backend/app/database.py` — this is the one file that opens the
MongoDB connection. It reads the connection string from `MONGO_URI` in
`backend/.env`, so you never hardcode credentials in code.

- **Local MongoDB:** install MongoDB Community Server, run it, then in
  `backend/.env`:
  ```
  MONGO_URI=mongodb://localhost:27017
  ```
- **MongoDB Atlas (cloud, free tier):** create a cluster at
  https://cloud.mongodb.com, click Connect → Drivers, copy the string, e.g.:
  ```
  MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net
  ```
  Then whitelist your IP in Atlas → Network Access.

## 3. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env with your MONGO_URI

python -m app.ml.generate_dataset   # or drop in your own dataset first
python -m app.ml.train_model        # trains and saves model.pkl

uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health (also confirms Mongo is reachable)

## 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` requests to
`http://localhost:8000`, so make sure the backend is running first.

Register an account on the `/register` page, then log in.

## 5. How the pieces map to the milestones

| Milestone | Where it lives |
|---|---|
| M1 — Auth (login/register/roles/reset), dashboard, DB, APIs | `auth_router.py`, `users_router.py`, `dashboard_router.py`, `database.py`, `postgres_db.py`, `frontend/src/pages/Login.jsx` + `Register.jsx` + `Dashboard.jsx` + `Profile.jsx` + `UserManagement.jsx` |
| M2 — AI detection, risk scoring, packet monitoring | `ml/train_model.py`, `ml/model.py`, `ml/dataset_status.py`, `predict_router.py`, `packets_router.py`, `frontend/src/pages/PacketMonitoring.jsx`, the "Analyze Traffic Sample" form on the dashboard |
| M3 — Alerts, analytics, reports, settings | `alerts_router.py`, `analytics_router.py`, `reports_router.py`, `settings_router.py`, `frontend/src/pages/Alerts.jsx` + `Analytics.jsx` + `Reports.jsx` + `Settings.jsx` |
| M4 — Deployment | see below |

## 5a. Milestone 1 & 2 completion checklist

| Requirement | Status |
|---|---|
| Login / Register / JWT auth | ✅ |
| Remember Me | ✅ |
| Forgot Password / Reset Password flow | ✅ |
| Password strength meter + validation | ✅ |
| Duplicate email / username validation | ✅ |
| Admin & Security Analyst roles (RBAC) | ✅ |
| User Profile / Change Password | ✅ |
| Admin: User List / Edit Role / Disable / Delete | ✅ |
| Dashboard: packets, threats, alerts, risk cards | ✅ |
| Dashboard: AI Model Status / Dataset Status | ✅ |
| Dashboard: Network Health / System Health | ✅ |
| Dashboard: Detection History / Latest Threats | ✅ |
| Packet Monitoring (search/filter/sort/pagination) | ✅ (simulated traffic — see TRAINING_GUIDE.md to wire up real capture) |
| Dataset Status states (waiting/loaded/ready/trained) | ✅ |
| Prediction output (confidence, threat level, actions, ID) | ✅ |
| Model evaluation (accuracy/precision/recall/F1/ROC-AUC/confusion matrix/feature importance) | ✅ |
| Analytics (trend, distribution, protocol, risk, stats) | ✅ |
| Alerts (resolve, false positive, filters, search, pagination) | ✅ |
| Reports (CSV + PDF for threat/prediction/traffic) | ✅ |
| Settings (Mongo/Postgres placeholders, AI config, notifications) | ✅ |
| PostgreSQL connection layer (optional, ready) | ✅ |
| TRAINING_GUIDE.md | ✅ |
| Dark theme, glassmorphism, Tailwind, Framer Motion, sidebar, skeletons, toasts | ✅ |

Not yet done (flagged, not silently skipped): live packet capture
(Wireshark/Zeek integration — currently simulated by design, per your
instructions, until you're ready to wire it in), and an actual production
email provider for password-reset delivery (currently logs the reset link
to the backend console instead of sending real email — see
`auth_router.py`'s `forgot_password`).

## 6. Deploying (no Docker)

- **Backend:** any host that runs Python works — Render, Railway, PythonAnywhere,
  or a plain VPS. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  Set `MONGO_URI`, `JWT_SECRET`, etc. as environment variables on the host
  instead of a `.env` file.
- **Database:** MongoDB Atlas (already cloud-hosted, nothing to deploy).
- **Frontend:** `npm run build` produces a static `dist/` folder you can host
  on Vercel, Netlify, GitHub Pages, or any static file host. Point its API
  calls at your deployed backend URL (edit `vite.config.js` proxy or set an
  `VITE_API_URL` env var and update `src/api.js` to use it).

## Notes

- The synthetic dataset/model are for getting the app running end-to-end;
  swap in a real dataset (see §1) before treating detection results as
  meaningful for a real report or demo.
- Default JWT secret in `.env.example` is a placeholder — always replace it
  with a real random string before any real deployment.
