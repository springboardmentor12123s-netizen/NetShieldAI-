from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import threading

from services.packet_capture import start_sniffing

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.teams import router as teams_router
from routes.audit import router as audit_router
from routes.network import router as network_router
from routes.ai import router as ai_router
from routes.report import router as report_router
from routes.alerts import router as alerts_router
from routes.incidents import router as incidents_router
from routes.analytics import router as analytics_router
from routes.timeline import router as timeline_router
from routes.threat_stats import router as threat_stats_router


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to NetShield AI",
        "status": "Backend Running Successfully"
    }


# -----------------------------
# Include Routers
# -----------------------------

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(teams_router)
app.include_router(audit_router)
app.include_router(network_router)
app.include_router(ai_router)
app.include_router(report_router)
app.include_router(incidents_router)

app.include_router(
    alerts_router,
    prefix="/alerts",
    tags=["Alerts"]
)

app.include_router(
    incidents_router,
    prefix="/incidents",
    tags=["Incidents"]
)

app.include_router(
    analytics_router,
    prefix="/analytics",
    tags=["Analytics"]
)

app.include_router(
    timeline_router,
    prefix="/timeline",
    tags=["Timeline"]
)

app.include_router(
    threat_stats_router,
    prefix="/threat-stats",
    tags=["Threat Statistics"]
)

# -----------------------------
# Start Live Packet Capture
# -----------------------------

threading.Thread(
    target=start_sniffing,
    daemon=True
).start()

