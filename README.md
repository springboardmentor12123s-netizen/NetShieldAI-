# NetShield AI 🛡️

NetShield AI is an advanced, AI-powered network security and monitoring platform. It actively monitors network traffic, detects anomalies, and classifies threats in real-time using Machine Learning algorithms.

## 🚀 Features

- **Real-Time Dashboard**: Visualize network traffic, threat statistics, and active alerts.
- **Threat Intelligence**: Interactive interface to view scored network records and detailed threat classifications.
- **AI Models Pipeline**: 
  - **Anomaly Detection**: Powered by `Isolation Forest` to detect deviations from normal traffic baselines.
  - **Threat Classification**: Powered by `XGBoost` to classify specific attacks (e.g., DDoS, PortScan, Bot).
- **Automated Model Training**: Train and evaluate models dynamically in the background with Estimated Time of Completion (ETC) tracking.
- **Containerized Infrastructure**: Fully dockerized frontend, backend, and databases for seamless deployment.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Backend**: Python, FastAPI, SQLAlchemy, Motor
- **Machine Learning**: Scikit-Learn, XGBoost, Joblib
- **Databases**: PostgreSQL (Relational Data), MongoDB (Network Traffic Data)
- **Deployment**: Docker & Docker Compose

## ⚙️ How to Run Locally

Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

1. **Start the containers**
   ```bash
   docker-compose up -d --build backend frontend
   ```

2. **Access the Application**
   - **Frontend**: [http://localhost:8173](http://localhost:8173)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

3. **Login Credentials**
   - **Username**: `admin`
   - **Password**: `admin`

## 📊 Project Structure

- `/frontend` - React application source code
- `/backend` - FastAPI server and Machine Learning services
- `/models` - Trained serialized AI models (`.joblib`)
- `docker-compose.yml` - Infrastructure orchestration
