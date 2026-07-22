# NetShield AI: UI Wireframes & Layout Planning

This document details the layout structure, grid systems, and components designed for the NetShield AI Security Operations Center (SOC) dashboard.

---

## 🏗️ Layout & Grid Planning

We use a responsive layout with a dark theme (curated slate/indigo palette) to simulate a premium security operations display.

### 1. Main Navigation Shell
- **Placement**: Fixed left sidebar for laptop/desktop dimensions; collapsible top header for mobile.
- **Components**: Logo banner, navigation buttons (Dashboard, Traffic logs, Teams, Alert Rules, Profiles), status indicators (Database connection, Celery worker heartbeat).

### 2. Main Dashboard Layout (Grid Structure)
- **Top Row (4 Columns)**: 
  - StatCard (Total Packets) — displays count updates.
  - StatCard (Traffic Volume) — displays payload size in KB/MB/GB.
  - StatCard (Unique Sources) — displays count of unique remote IPs.
  - StatCard (Bandwidth Mbps) — shows traffic throughput.
- **Middle Row (3-Column Split)**:
  - **Left Segment (2/3 width)**: Data Ingestion Chronology (Area/Line chart displaying bandwidth usage trends over time).
  - **Right Segment (1/3 width)**: Live Threat Alerts Feed (Reactive table highlighting flagged anomalies).
- **Bottom Row (2 Columns)**:
  - **Left Segment (1/2 width)**: Protocol Distribution (Doughnut/pie chart indicating TCP, UDP, ICMP, SSH proportions).
  - **Right Segment (1/2 width)**: ML Model Inference Status (Displays performance metrics and system alerts).

---

## 🎨 Visual Wireframe Previews

Below are visual look-and-feel mockups generated for the platform pages:

### Core SOC Dashboard Layout
![SOC Operations Dashboard](/docs/wireframes/soc_dashboard_wireframe.svg)

### Incident Traffic Monitor & Packet Inspector
![Traffic Logs & Inspector](/docs/wireframes/traffic_monitor_wireframe.svg)

