from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import register, login, dashboard
from .auth_utils import get_current_user, require_role

# Creates the users / audit_logs tables if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NetShield AI - Auth & Monitoring API")

# CHANGE THIS: restrict origins to your real frontend URL in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register and Login are two separate routers/endpoints:
#   POST /auth/register
#   POST /auth/login
app.include_router(register.router)
app.include_router(login.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"status": "NetShield AI backend running"}


@app.get("/me")
def read_current_user(current_user=Depends(get_current_user)):
    return {"email": current_user.email, "role": current_user.role, "full_name": current_user.full_name}


@app.get("/admin/dashboard")
def admin_only(current_user=Depends(require_role("admin"))):
    return {"message": f"Welcome admin {current_user.full_name}"}
