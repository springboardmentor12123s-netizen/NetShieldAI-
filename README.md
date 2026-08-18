# NetShield AI

NetShield AI is an AI-powered network security platform that monitors network traffic, detects attacks, assesses risk, and provides real-time security insights through a web dashboard.

## Key Features

- Live network traffic monitoring
- ML-based attack detection and classification
- Risk assessment and threat alerts
- Security analytics and attack trends
- Intrusion forecasting
- User authentication and role-based access
- Live model validation

## Tech Stack

- **Frontend:** React.js, Axios, Tailwind CSS
- **Backend:** Python, FastAPI, Uvicorn, SQLAlchemy
- **Database:** PostgreSQL
- **AI/ML:** Scikit-learn, Pandas, NumPy, Joblib
- **Network Monitoring:** PyShark
- **DevOps:** Docker, Docker Compose
- **Tools:** Git, GitHub, Swagger/OpenAPI

## Run Locally

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

### Frontend

```powershell
cd frontend
npm install
npm start
```

### Swagger

```text
http://localhost:8000/docs
```

## Docker

Run from the project root:

```powershell
docker compose up --build
```

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

Stop containers:

```powershell
docker compose down
```

## Model Validation

The system validates:

- Benign
- Web Attack - XSS
- Web Attack - SQL Injection
- Web Attack - Brute Force

Metrics include Accuracy, Precision, Recall, F1 Score, and ROC-AUC.

## Intrusion Forecasting

NetShield AI analyzes recent attack activity to identify trends and generate a threat-level forecast.

## Project Structure

```text
Netsheild_AI/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Future Scope

- Cloud deployment
- SIEM integration
- Advanced threat intelligence
- Automated incident response