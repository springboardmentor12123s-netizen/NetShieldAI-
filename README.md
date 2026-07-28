# NetShield AI — Milestone 1 & 2 Starter Code

## Folder structure
```
netshield-ai/
  backend/            <- Milestone 1: Auth (separate register/login), RBAC
    app/
      main.py
      database.py
      models.py
      schemas.py
      auth_utils.py
      routers/
        register.py   <- POST /auth/register
        login.py      <- POST /auth/login
  frontend/           <- Milestone 1: Separate register & login pages
    pages/
      register.jsx
      login.jsx
    utils/api.js
  ml/                 <- Milestone 2: Anomaly detection & intrusion prediction
    data_preprocessing.py
    train_anomaly_detection.py
    predict.py
    data/             <- put your downloaded dataset CSVs here
    models/           <- trained models get saved here automatically
```

## Milestone 1 — Backend setup
1. `cd backend`
2. `python -m venv venv && source venv/bin/activate` (Windows: `venv\Scripts\activate`)
3. `pip install -r requirements.txt`
4. By default this project uses **SQLite** — no database server install needed. It just
   creates a `netshield.db` file inside `backend/` automatically the first time you run it.
   Optionally create a `.env` file in `backend/` with a custom `SECRET_KEY`:
   ```
   SECRET_KEY=some-long-random-string
   ```
   (If you want PostgreSQL instead later, uncomment `psycopg2-binary` in `requirements.txt`,
   install PostgreSQL, and set `DATABASE_URL=postgresql://netshield_user:yourpassword@localhost:5432/netshield_db` in `.env`.)
5. Run: `uvicorn app.main:app --reload`
6. Test in browser: `http://localhost:8000/docs` — you'll see `/auth/register` and `/auth/login` as two separate endpoints.

## Milestone 1 — Frontend setup
1. `cd frontend`
2. If you don't have a Next.js app yet: `npx create-next-app@latest . ` (choose JavaScript), then drop these `pages/register.jsx`, `pages/login.jsx`, and `utils/api.js` into place.
3. `npm run dev`
4. Visit `http://localhost:3000/register` and `http://localhost:3000/login` — two completely separate pages/URLs, as requested.

## Milestone 2 — Training on your downloaded dataset

**This is exactly where to plug in your data and train/test:**

1. Put your downloaded dataset CSV file(s) into `ml/data/` (e.g. the CICIDS2017 or UNSW-NB15 CSVs).
2. Open `ml/data_preprocessing.py` and change these two lines near the top:
   ```python
   DATA_DIR = "./ml/data"        # <- folder with your CSVs
   LABEL_COLUMN = "Label"        # <- "Label" for CICIDS2017, "label" for UNSW-NB15
   ```
3. Install ML dependencies:
   ```
   cd ml
   pip install -r requirements.txt
   ```
4. Train and test the models (this does the train/test split and prints accuracy, precision, recall, F1, and a confusion matrix for each model):
   ```
   python train_anomaly_detection.py
   ```
   This trains and evaluates:
   - **Isolation Forest** — unsupervised anomaly detection
   - **Random Forest** — supervised intrusion/attack classification
   - **XGBoost** — supervised, usually the highest-accuracy classifier

   Trained models are saved automatically to `ml/models/`.
5. To test the trained models on new/unseen traffic later:
   - Put the new CSV somewhere, update `NEW_DATA_PATH` in `ml/predict.py`
   - Run `python predict.py`
   - Results (predicted attack type + anomaly flag per row) are saved to `ml/predictions_output.csv`

## Notes
- If your dataset has a different label column name or extra ID columns, `data_preprocessing.py` automatically drops non-numeric columns except the label, but double check `LABEL_COLUMN` matches your file's actual header.
- CICIDS2017 files are large — if training is slow, start with just one day's CSV in `ml/data/` first (e.g. Monday-WorkingHours.pcap_ISCX.csv) to confirm everything runs end-to-end, then add the rest.
