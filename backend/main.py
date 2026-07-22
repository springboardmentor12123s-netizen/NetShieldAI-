from routes.network import router as network_router
from services.packet_capture import start_sniffing
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.teams import router as teams_router
from routes.audit import router as audit_router
from routes.network import router as network_router
from routes.ai import router as ai_router
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


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(teams_router)
app.include_router(audit_router)
app.include_router(network_router)
app.include_router(ai_router)

threading.Thread(
    target=start_sniffing,
    daemon=True
).start()

from routes.report import router as report_router
app.include_router(report_router)