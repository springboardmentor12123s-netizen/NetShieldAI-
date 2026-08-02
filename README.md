# NetShield AI – Intelligent Network Threat Detection System

## Overview

NetShield AI is a Network Intrusion Detection System (NIDS) that monitors live network traffic, predicts cyber attacks using a Machine Learning model, generates security alerts, and provides real-time security analytics through an interactive dashboard.

This project was developed as part of the Springboard Network Security learning program.

---

## Features

### Live Packet Monitoring
- Captures live network packets
- Builds network flows from captured packets
- Extracts flow-based features
- Performs real-time traffic prediction

### Machine Learning Detection
- Random Forest based attack prediction
- Detects:
  - BENIGN
  - PortScan
  - DoS
  - DDoS
  - Bot
  - Web Attacks
  - FTP-Patator
  - SSH-Patator
  - Heartbleed
  - Infiltration
  - and other CICIDS2017 attack categories

### Alert Management
- Automatic threat generation
- Severity classification
- Alert status management
- Incident tracking

### Security Analytics
- Traffic summary
- Attack distribution
- Protocol distribution
- Top destination ports
- Live traffic analytics
- Threat visualization dashboard

### Reports
- Download Live Traffic Report (CSV)
- Download Alerts Report (CSV)

---

## Technology Stack

### Frontend
- React
- Recharts
- React Router
- Axios

### Backend
- FastAPI
- SQLAlchemy
- Uvicorn

### Database
- PostgreSQL

### Machine Learning
- Scikit-Learn
- Random Forest Classifier
- Pandas
- NumPy

---

## Project Structure

```
NetShield-AI-Learning
│
├── backend
│   ├── app
│   │   ├── ai
│   │   ├── database
│   │   ├── packet
│   │   ├── routers
│   │   ├── services
│   │   └── models
│
├── frontend
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── services
│   │   └── styles
│
└── datasets
```

---

## Workflow

1. Capture live packets
2. Build network flows
3. Extract network features
4. Predict attack using ML model
5. Generate alerts
6. Store alerts
7. Display live dashboards
8. Export security reports

---

## Dashboard Modules

- Dashboard
- Live Network Traffic
- Alerts
- Analytics
- Reports

---

## APIs

### Prediction
- GET `/predictions`

### Traffic
- GET `/traffic`

### Alerts
- GET `/alerts`
- PUT `/alerts/{id}`

### Analytics
- GET `/analytics/summary`
- GET `/analytics/attack-types`
- GET `/analytics/protocol-distribution`
- GET `/analytics/top-ports`
- GET `/analytics/traffic-trend`

### Reports
- GET `/reports/traffic/csv`
- GET `/reports/alerts/csv`

---

## Milestone 3 Achievements

- Live packet capture
- Flow builder
- Real-time ML prediction
- Threat alert generation
- Alert management
- Security analytics dashboard
- Attack visualization
- Threat intelligence reports
- Monitoring workflows
- CSV report generation

---

## Future Enhancements

- Email notifications
- SMS alerts
- Role-based authentication
- SIEM integration
- Threat intelligence feeds
- Docker deployment
- Cloud deployment
- WebSocket live updates

---

## Author

**Poshita Kareti**

Springboard Network Security Program
