# NetShield AI – Network Anomaly Detection & Threat Monitoring System

![NetShield AI Dashboard](https://via.placeholder.com/1200x600?text=NetShield+AI+Dashboard)

## 📌 Project Overview
NetShield AI is a comprehensive, full-stack cybersecurity platform designed to detect network anomalies and classify threats using Machine Learning (Isolation Forest). It processes raw network traffic (PCAP) or live packet captures, extracts relevant features, and performs real-time inference to detect attacks like DDoS, Brute Force, Port Scans, and more. It also features a built-in Security Operations Center (SOC) dashboard to monitor incidents, prioritize alerts based on severity, and manage threats efficiently.

## 🚀 Features
- **Machine Learning Engine**: Trains an Isolation Forest model to detect anomalous network traffic accurately.
- **Real-Time Threat Detection**: Captures live network packets (via Npcap) and predicts threats on the fly.
- **Automated Feature Extraction**: Processes raw PCAP files and extracts statistical flow features required for the model.
- **Interactive SOC Dashboard**: Real-time charts and telemetry using Recharts.
- **Incident Management System**: Automatically generates incidents for detected attacks and allows analysts to assign, investigate, and close them.
- **Dataset Management**: Upload, train, and manage historical datasets.
- **Report Generation**: Export predictions and incident reports to CSV or PDF formats.

## 🏗 Architecture
The system consists of three main pillars:
1. **Frontend (React + Vite)**: A dynamic, dark-themed SOC UI for monitoring and management.
2. **Backend (FastAPI)**: A high-performance REST API handling ML training, prediction, live capture, and database management.
3. **ML Core (Scikit-Learn)**: Processes data, builds models, and scores risk based on confidence and threat category.

## 🛠 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, jsPDF, Lucide React.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, SQLite (default) / PostgreSQL, Pandas, NumPy, Scikit-Learn.
- **Packet Capture**: Scapy, Npcap (Windows).

## 📂 Folder Structure
```text
NetShieldAI/
├── backend/                  # FastAPI backend server
│   ├── app/                  # Application code (routers, services, models, schemas)
│   ├── predictions/          # Generated prediction CSVs
│   ├── saved_models/         # Serialized ML models (.joblib)
│   ├── uploads/              # Uploaded training datasets and PCAP files
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React frontend application
│   ├── src/                  # React components, pages, and contexts
│   ├── index.html            # Entry HTML
│   └── package.json          # Node dependencies
├── ml_core/                  # Core ML scripts and generated assets (e.g., confusion matrix)
├── sample_data/              # Sample training and prediction CSVs
└── scripts/                  # Utility scripts for database population
```

## ⚙️ Installation

### Prerequisites
- **Node.js**: v18 or higher
- **Python**: 3.10 or higher
- **Npcap** (Windows only): Required for live packet capture.

### 1. Npcap Installation (Windows)
If you intend to use the Live Packet Capture feature on Windows, you **must** install Npcap.
1. Download Npcap from [npcap.com](https://npcap.com/).
2. Run the installer.
3. **Important**: Check the box that says *"Install Npcap in WinPcap API-compatible Mode"*.
4. Ensure you run the backend server as an **Administrator** for Scapy to access network interfaces.

### 2. Backend Setup
Navigate to the backend directory and set up the Python virtual environment:
```bash
cd backend
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Activate virtual environment (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

## 🚀 How to Run

### Start the Backend Server
Run the FastAPI server (Ensure you run your terminal as Administrator if using Live Capture):
```bash
cd backend
# With virtual environment activated
uvicorn app.main:app --reload --port 8000
```
The backend API will be available at `http://localhost:8000`. You can access the Swagger documentation at `http://localhost:8000/docs`.

### Start the Frontend Server
Run the Vite development server:
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 📡 API Overview
The backend exposes several REST endpoints:
- `POST /api/auth/login`: Authenticate users.
- `GET /api/dashboard`: Get SOC overview metrics.
- `POST /api/datasets/upload`: Upload training datasets.
- `POST /api/ml/train`: Train the ML model.
- `POST /api/predict/upload`: Upload data for batch prediction.
- `POST /api/live/start`: Start live packet capture.
- `GET /api/incidents`: Fetch generated incidents.

## 📸 Screenshots

*(Placeholders for future screenshots)*

1. **Dashboard Overview**  
   ![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)
2. **Live Predictions**  
   ![Live Capture](https://via.placeholder.com/800x400?text=Live+Capture+Screenshot)
3. **Incident Management**  
   ![Incidents](https://via.placeholder.com/800x400?text=Incident+Management+Screenshot)

## 🔮 Future Scope
- **Deep Learning Integration**: Incorporate LSTM or Autoencoders for sequential anomaly detection.
- **Distributed Agents**: Deploy lightweight packet capture agents across multiple subnets.
- **Advanced Reporting**: Scheduled email reports for analysts.

## 📄 License
This project is for educational and portfolio purposes.

## 👨‍💻 Author
Developed by the NetShield AI Team.