

# 🛡️ NetShield AI

NetShield AI is a full-stack network security platform that detects anomalies in real-time, visualizing network traffic and potential threats through an interactive dashboard.

---

## ✨ Key Features

* **Real-Time Threat Detection:** Ingests live network traffic and instantly flags malicious packets or anomalies.
* **Live Analytics Dashboard:** Visualizes network flow and threat ratios using responsive line and doughnut charts.
* **Role-Based Access Control:** Secure user management with JWT authentication and admin privileges.
* **System Audit Logging:** Tracks and logs key system events and user actions for security compliance.
* **Live Traffic Simulator:** Includes a custom script (`replayer.py`) that generates synthetic network packets to test the live cloud database.

---

## 🛠️ Tech Stack

### Frontend (Deployed on Vercel)
* **Framework:** Next.js (TypeScript)
* **Styling:** Tailwind CSS
* **Data Visualization:** Chart.js

### Backend (Deployed on Render)
* **Framework:** FastAPI (Python)
* **Database:** Cloud SQL via SQLAlchemy
* **Security:** JWT Authentication, optimized `bcrypt` password hashing

---

## 🚀 How It Works (The Data Pipeline)

1. **Traffic Generation:** The `replayer.py` script mimics a network interface, generating batches of network packets.
2. **Data Ingestion:** The script sends these packets to the live FastAPI backend via secure POST requests.
3. **Database Storage:** The backend processes the packets and stores them permanently in the Cloud SQL database.
4. **Client Visualization:** The Next.js frontend fetches this data in real-time, instantly updating the UI on any device.

---

## 💻 Local Development Setup

Follow these steps to run the project on your local machine. 

### Prerequisites
* Python 3.x
* Node.js & npm

### 1. Setup the Backend
Open a terminal and navigate to your backend folder:

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the local server (runs on port 8000)
uvicorn main:app --reload


### 2. Setup the Frontend

Open a new terminal and navigate to your frontend folder:

# Install dependencies
npm install

# Start the Next.js development server (runs on port 3000)
npm run dev


### 3. Generate Live Traffic

With your backend running, open a third terminal and run the simulator to see data flow into your dashboard:


python replayer.py



## 🔐 Environment Variables

To run this project securely, you need to set up the following environment variables.

**Frontend (`.env.local`)**

NEXT_PUBLIC_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)   # Use your Render URL for production


**Backend (`.env`)**

DATABASE_URL=your_cloud_database_connection_string
SECRET_KEY=your_secure_jwt_secret_key
ALGORITHM=HS256

```

---

## 👨‍💻 Author

**Aryan Kumar**

Computer Science Engineering, Class of 2027

VIT Bhopal University

```

```
