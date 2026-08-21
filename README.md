
# 🛡️ NetShield AI

**Springboard Software Engineering Capstone Project**

NetShield AI is a full-stack network security platform that detects anomalies in real-time, visualizing network traffic and potential threats through an interactive dashboard.

---

## ✨ Key Features

* **Real-Time Threat Detection:** Ingests live network traffic and instantly flags malicious packets or anomalies.
* **Live Analytics Dashboard:** Visualizes network flow and threat ratios using responsive line and doughnut charts.
* **Live Packet Sniffing:** Utilizes a custom `sniffer.py` script to actively monitor and capture live network traffic across designated interfaces.
* **Live Traffic Simulator:** Includes a custom script (`replayer.py`) that generates synthetic network packets to test the live database and ML models or NCAP for detecting your live traffic
* **Role-Based Access Control:** Secure user management with JWT authentication and admin privileges.
* **System Audit Logging:** Tracks and logs key system events and user actions for security compliance.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Next.js (TypeScript)
* **Styling:** Tailwind CSS
* **Data Visualization:** Chart.js

### Backend
* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL (Relational/Users) & MongoDB (Unstructured/Traffic)
* **Security:** OAuth2, JWT Authentication, optimized `PBKDF2` password hashing (via Passlib)
* **Network Capture & Scanning:** Npcap, Nmap, Custom Python Sniffer / Replayer

---

## 🚀 How It Works (The Data Pipeline)

1. **Traffic Capture & Generation:** The system uses `sniffer.py` to capture live network packets, while `replayer.py` can be used to generate synthetic threat batches for testing.
2. **Data Ingestion:** These scripts send packets to the live FastAPI backend via secure POST requests.
3. **Database Storage:** The backend processes the packets, storing user/audit data in PostgreSQL and massive packet logs in MongoDB.
4. **Client Visualization:** The Next.js frontend fetches this data in real-time, instantly updating the UI on any device.

---

## 💻 Local Development Setup

Follow these steps to run the project on your local machine. 

### Prerequisites
* Python 3.10+
* Node.js & npm

### 1. Setup the Backend
Open a terminal and navigate to your backend folder:

``bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the local server (runs on port 8000)
uvicorn main:app --reload

``

### 2. Setup the Frontend

Open a new terminal and navigate to your frontend folder:

# Install dependencies
npm install

# Start the Next.js development server (runs on port 3000)
npm run dev


### 3. Capture or Generate Live Traffic

With your backend running, open a third terminal and run either the sniffer or the simulator to see data flow into your dashboard:

# To capture actual live network traffic:
python sniffer.py

# OR to generate synthetic test traffic:
python replayer.py

``


## 🔐 Environment Variables

To run this project securely, you need to set up the following environment variables.

**Frontend (.env.local`)**

``text
NEXT_PUBLIC_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)   # Use your deployed URL for production

``

**Backend (`.env`)**

``text
DATABASE_URL=your_postgresql_database_connection_string
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_secure_jwt_secret_key
ALGORITHM=HS256
SLACK_WEBHOOK_URL=your_slack_webhook_url
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=yr mail
SMTP_APP_PASSWORD= 16 digit smtp pass


``

---

## 👨‍💻 Author

**Aryan Kumar**

Computer Science Engineering, Class of 2027

VIT Bhopal University

```

```
