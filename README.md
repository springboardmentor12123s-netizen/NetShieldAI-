🛡️ NetShield AI: Network Anomaly Detection & Threat Monitoring System
NetShield AI is an advanced, AI-powered Security Operations Center (SOC) platform designed to continuously monitor network traffic, identify suspicious behavior, predict potential intrusions, and generate real-time threat alerts.

By leveraging Machine Learning models trained on the CICIDS2017 dataset, the system can differentiate between normal network flows and malicious activities such as DDoS, PortScan, and Brute-Force attacks, providing security teams with actionable threat intelligence and risk scoring.

📋 Table of Contents
Key Features
Tech Stack
System Architecture
AI & Machine Learning Pipeline
Getting Started (Docker Deployment)
Running the Traffic Simulator
Project Structure
✨ Key Features
1. Security Operations Dashboard
Real-time Command Center: Live metrics displaying total network flows, active threats, and protocol distribution.
Visual Analytics: Interactive charts (Line, Doughnut, Bar) tracking traffic volume, protocol usage, and attack classifications over time.
Live Network Flow Monitor: A streaming table that displays live network packets, color-coding benign (gray) and malicious (red) traffic.
2. AI Threat Detection Engine
Anomaly Detection: Uses Isolation Forest to identify statistically unusual network behavior.
Attack Classification: Employs a Random Forest classifier to categorize the specific type of attack (DDoS, PortScan, BruteForce).
Risk Scoring: Dynamically calculates a risk score (0-100) based on AI confidence and attack type.
Manual AI Scanner: Frontend button allowing analysts to run a manual AI scan on the latest network flow.
3. Alert & Incident Management
Automated Alerting: Automatically logs threats to the database when the AI detects a risk score above 50%.
Security Alerts Dashboard: A dedicated page for analysts to view filtered, high-priority threats.
Incident Response: Analysts can update alert statuses from "New" to "Investigating" or "Resolved" directly from the UI.
PDF Threat Reports: One-click generation and download of professional PDF threat intelligence reports using jsPDF.
🛠️ Tech Stack
Frontend: Next.js (React), Tailwind CSS, Chart.js, Lucide Icons, jsPDF.
Backend: Python, FastAPI, Uvicorn, Pydantic.
Databases: PostgreSQL (Relational data, Alerts, Users), MongoDB (Network flow logs).
AI & Machine Learning: Scikit-learn, Pandas, NumPy, Joblib.
DevOps & Deployment: Docker, Docker Compose.
🏗️ System Architecture
NetShield AI is built using a modern microservices architecture, fully containerized using Docker Compose:

Frontend Container (Port 3000): Serves the Next.js application to the client's browser.
Backend Container (Port 8000): Hosts the FastAPI application, handling API requests, AI predictions, and database logic.
PostgreSQL Container (Port 5432): Stores user credentials, role-based access control, and structured security alerts.
MongoDB Container (Port 27017): Stores high-volume, unstructured live network traffic flow logs.
🧠 AI & Machine Learning Pipeline
The AI engine utilizes two models trained on the CICIDS2017 dataset:

StandardScaler: Normalizes network features (e.g., Flow Duration, Packet Lengths, Bytes/sec) to ensure accurate model predictions.
Isolation Forest (anomaly_detector.pkl): An unsupervised learning algorithm that identifies anomalies by isolating outliers in the dataset.
Random Forest (threat_classifier.pkl): A supervised learning algorithm that takes the anomalous flow and classifies it into a specific attack category.
Feature Extraction: The system extracts 7 key network flow features to feed into the AI models:

Flow Duration
Total Fwd / Backward Packets
Fwd Packet Length Max / Mean
Flow Bytes/s
Flow Packets/s
🚀 Getting Started (Docker Deployment)
The entire application can be spun up with a single command using Docker Compose.

Prerequisites
Docker Desktop installed and running.
Git (to clone the repository).
Installation & Execution
Clone the repository:
git clone <your-repo-url>cd NetShield-AI
Build and start the Docker containers:(This will build the Frontend, Backend, PostgreSQL, and MongoDB containers).
docker-compose up --build
Access the Application:
Frontend UI: http://localhost:3000
Backend API Docs (Swagger): http://localhost:8000/docs
📡 Running the Traffic Simulator
To see the live dashboard and AI in action, you need to feed network traffic into the system. A Python script is provided to simulate realistic network flows (both benign and malicious).

Open a new terminal window.
Navigate to the backend folder and activate the virtual environment:
cd backend.\venv\Scripts\Activate.ps1cd app
Run the streamer script:
python stream_live_traffic.py
You will see threats being detected in the terminal, and they will immediately appear on the Next.js Dashboard and Alerts pages.

📁 Project Structure
NetShield-AI/│├── backend/│   ├── app/│   │   ├── main.py             # FastAPI entry point & router setup│   │   ├── database.py         # PostgreSQL SQLAlchemy engine│   │   ├── mongo_db.py         # MongoDB PyMongo client│   │   ├── models.py           # Database schemas (User, Alert, Role)│   │   ├── ai_engine.py        # ML model loading & prediction logic│   │   ├── stream_live_traffic.py # Simulated network traffic generator│   │   └── routers/            # API endpoints (auth, traffic, ai, alerts)│   ├── ml_models/              # Saved .pkl Scikit-learn models│   ├── requirements.txt        # Python dependencies│   └── Dockerfile              # Backend container config│├── frontend/│   ├── src/│   │   └── app/│   │       ├── page.tsx        # Login Page│   │       ├── dashboard/      # SOC Command Center (Charts, Live Table)│   │       └── alerts/         # Alert Management & PDF Report Generation│   ├── package.json            # Node dependencies│   └── Dockerfile              # Frontend container config│└── docker-compose.yml          # Orchestrates all 4 containers