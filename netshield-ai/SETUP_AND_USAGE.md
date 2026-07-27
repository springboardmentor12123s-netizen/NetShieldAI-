# NetShield AI — Setup & Usage Guide

Enterprise AI-powered Network Anomaly Detection & Threat Monitoring System.
Backend: FastAPI + MongoDB + scikit-learn + Scapy. Frontend: React + Vite.

This guide takes a fresh clone from zero to a fully working system: auth,
dashboard, live packet capture, AI prediction, alerts + email, and model
training from the UI.

---

## 1. Required Packages

**Backend (Python 3.10+):**
All pinned in `backend/requirements.txt` — installed in Step 3. Notable ones:
- `fastapi`, `uvicorn` — API server
- `motor`, `pymongo` — MongoDB async driver
- `scikit-learn`, `pandas`, `joblib` — ML training/inference
- `scapy` — live packet capture (Feature 1)
- `passlib[bcrypt]==1.7.4` + `bcrypt==4.0.1` — password hashing (pinned together — see Troubleshooting)
- `python-jose` — JWT
- `reportlab` — PDF report export
- `python-dotenv`, `pydantic-settings` — `.env` config loading

**Frontend (Node.js 18+):**
React 18, Vite, axios, react-router-dom, recharts, lucide-react, react-hot-toast — all in `frontend/package.json`.

**System-level (for live packet capture only):**
- **Linux:** libpcap (`sudo apt install libpcap-dev`) + root or `CAP_NET_RAW` capability
- **macOS:** built-in libpcap, run with `sudo`
- **Windows:** [Npcap](https://npcap.com/#download) installed, run terminal as Administrator

Live capture is optional — every other feature works without it, and you can
always use "Simulate Traffic" instead.

---

## 2. Installation

```bash
git clone <your-repo-url>
cd netshield-ai

# ---- Backend ----
cd backend
python -m venv venv

# Activate the virtual environment:
source venv/bin/activate        # Linux / macOS
venv\Scripts\activate           # Windows (PowerShell/CMD)

pip install -r requirements.txt

# ---- Frontend ----
cd ../frontend
npm install
```

---

## 3. Environment Variables

Copy the example file and fill in your own values:

```bash
cd backend
cp .env.example .env       # Linux/macOS
copy .env.example .env     # Windows
```

### Example `.env`

```env
# ---- Auth ----
SECRET_KEY=change_this_to_a_long_random_string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
REMEMBER_ME_EXPIRE_MINUTES=20160
RESET_TOKEN_EXPIRE_MINUTES=30

# ---- MongoDB (primary database) ----
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=netshield_ai

# ---- PostgreSQL (optional, not required) ----
POSTGRES_URI=

# ---- CORS ----
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000

# ---- Dataset ----
DATASET_PATH=app/data/network_traffic.csv

# ---- Model ----
MODEL_PATH=app/ml/model.pkl
MODEL_METRICS_PATH=app/ml/model_metrics.json

# ---- SMTP (Feature 2: password reset, Feature 3: critical alert emails) ----
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_USE_TLS=true
EMAIL_FROM_NAME=NetShield AI
FRONTEND_BASE_URL=http://localhost:5173

# ---- Critical Alert Emails ----
CRITICAL_ALERT_RISK_THRESHOLD=90
CRITICAL_ALERTS_ENABLED=true
SECURITY_TEAM_EMAIL=

# ---- Live Packet Capture ----
CAPTURE_INTERFACE=
CAPTURE_FLOW_TIMEOUT_SECONDS=3
CAPTURE_BPF_FILTER=ip

# ---- Dataset Uploads ----
UPLOAD_DIR=app/data/uploads
```

Every variable has a safe default except `MONGO_URI` (must point to a real
database) and the SMTP block (leave blank during development — see below).

---

## 4. MongoDB Setup

**Option A — Local MongoDB:**
```bash
# Install MongoDB Community Server, then:
mongod --dbpath /path/to/data/dir
```
Set `MONGO_URI=mongodb://localhost:27017` in `.env`.

**Option B — MongoDB Atlas (cloud, recommended for demos):**
1. Create a free cluster at https://cloud.mongodb.com
2. Database Access → add a user with a password
3. Network Access → allow your IP (or `0.0.0.0/0` for a demo)
4. Get the connection string and set:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

Collections (`users`, `predictions`, `alerts`, `packets`, `password_resets`,
`training_history`, `dataset_uploads`, `audit_logs`, `app_settings`) are
created automatically on first use — no manual schema setup needed.

---

## 5. SMTP Setup (password reset + critical alert emails)

**Without SMTP configured:** the app still works fully — reset links and
alert emails are printed to the backend console instead of sent, so you can
develop/demo without a mail account.

**To send real emails (Gmail example):**
1. Enable 2-Step Verification on the Google account
2. Create an App Password: https://myaccount.google.com/apppasswords
3. Set in `.env`:
   ```
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your_email@gmail.com
   SMTP_PASSWORD=<the 16-character app password>
   ```
Any standard SMTP provider (Outlook, SendGrid SMTP relay, AWS SES SMTP, your
company mail server) works the same way — just change `SMTP_SERVER`/`SMTP_PORT`.

---

## 6. Running the Backend

```bash
cd backend
source venv/bin/activate          # if not already active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API root: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

On first run, if no trained model exists, generate the demo dataset + train
once from the terminal (the Training page can be used instead — see Section 10):
```bash
python -m app.ml.generate_dataset
python -m app.ml.train_model
```

---

## 7. Running the Frontend

```bash
cd frontend
npm run dev
```
Open http://localhost:5173. The Vite dev server proxies all `/api` calls to
the backend on port 8000 (see `vite.config.js`) — no manual proxy setup needed.

For a production build:
```bash
npm run build     # outputs to frontend/dist
npm run preview   # serve the production build locally
```

---

## 8. Starting Live Packet Monitoring

1. Log in and open **Packet Monitoring** in the sidebar.
2. Click **Start Monitoring**.
   - Linux/macOS: run the backend with `sudo` (or grant `CAP_NET_RAW`), otherwise you'll see a permissions error in the status card.
   - Windows: install Npcap first, run the terminal as Administrator.
3. Captured traffic is aggregated into flows, run through the AI model
   automatically, stored in MongoDB, and shown live in the **Live AI
   Predictions** panel and the packet table (tagged `LIVE`).
4. Click **Stop Monitoring** to end the capture at any time.
5. **Simulate Traffic** remains available at any time for manual testing/demos
   without needing raw-socket permissions — packets are tagged `SIM`.

Tune `CAPTURE_INTERFACE`, `CAPTURE_FLOW_TIMEOUT_SECONDS`, and
`CAPTURE_BPF_FILTER` in `.env` if needed.

---

## 9. Uploading Datasets

1. Open the **Model Training** page.
2. Drag a `.csv` file onto the upload area (or click to browse).
3. The file is validated against the required columns:
   `duration, protocol_type, src_bytes, dst_bytes, packet_count, flow_rate,
   wrong_fragment, urgent, count, srv_count, label`
4. On success you'll see row/column counts, missing-value counts, and the
   class distribution before training starts.

---

## 10. Training the Model

1. After a dataset is uploaded and validated, click **Start Training**.
2. A progress bar and live log console show each stage (loading → splitting
   → training → evaluating → saving).
3. When complete, you'll see Accuracy, Precision, Recall, F1 Score,
   Confusion Matrix, Classification Report, and Training Time.
4. Click **Save & Activate This Model** to make it the live prediction model
   immediately — no backend restart required.
5. Past runs are listed under **Show Training History**, with the currently
   active run marked.

---

## 11. Terminal Commands Reference

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate               # venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m app.ml.generate_dataset      # optional: seed demo dataset
python -m app.ml.train_model           # optional: train once from CLI
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `bcrypt` / passlib error on register-login (`AttributeError: module 'bcrypt' has no attribute '__about__'`) | Already pinned in `requirements.txt` (`bcrypt==4.0.1`). If you upgraded bcrypt manually, reinstall: `pip install "bcrypt==4.0.1" --force-reinstall`. |
| `ModuleNotFoundError: No module named 'app'` | Run backend commands from inside the `backend/` folder, not the repo root. |
| MongoDB connection fails / `mongo_connected: false` on `/health` | Check `MONGO_URI` in `.env`; for Atlas, confirm your IP is allow-listed under Network Access. |
| CORS errors in the browser console | Make sure `FRONTEND_ORIGINS` in `.env` includes the exact origin shown in your browser's address bar (protocol + host + port). |
| Reset/alert emails not arriving | Check `SMTP_SERVER`/`SMTP_EMAIL`/`SMTP_PASSWORD` are all set — if any is blank, emails are only printed to the backend console (by design, for development). Check spam folder. Gmail requires an App Password, not your login password. |
| "Could not start packet capture" error | Needs raw-socket permission: run backend with `sudo` (Linux/macOS) or as Administrator with Npcap installed (Windows). Or just use **Simulate Traffic** instead. |
| `Cannot find module @rollup/rollup-linux-x64-gnu` (or similar) on `npm run build` | Delete `frontend/node_modules` and `frontend/package-lock.json`, then re-run `npm install`. This happens when `node_modules` was copied from a different OS. |
| Training fails with "missing required columns" | Your CSV must contain the exact numeric feature columns listed in Section 9, plus a `label` column. |
| `vite: Permission denied` running `npm run dev`/`build` | Run `chmod +x frontend/node_modules/.bin/*` (Linux/macOS) or simply reinstall with `npm install`. |
| Port 8000 or 5173 already in use | Stop the other process, or run with a different port: `uvicorn app.main:app --port 8001` and update `vite.config.js`'s proxy + `FRONTEND_ORIGINS` to match. |
| Live capture shows 0 packets after starting | Confirm `CAPTURE_INTERFACE` matches a real interface name on your machine (leave blank to auto-select), and that there's actual traffic on that interface. |

---

## 13. Default Login

A fresh database has no users — register the first account from the
**Register** page. The **first user ever registered is automatically made an
`admin`** (every user after that defaults to `security_analyst`), so no
manual database editing is needed to get admin access.

---

This project uses MongoDB as the sole database. PostgreSQL support in
`app/postgres_db.py` is optional and inactive unless `POSTGRES_URI` is set.
