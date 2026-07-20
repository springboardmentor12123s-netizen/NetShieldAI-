from fastapi import APIRouter, HTTPException

from app.schemas import LoginRequest

router = APIRouter(tags=["Authentication"])

USERS = {
    "admin": {
        "password": "admin123",
        "role": "admin",
        "name": "System Admin"
    },
    "analyst": {
        "password": "analyst123",
        "role": "analyst",
        "name": "Security Analyst"
    },
    "viewer": {
        "password": "viewer123",
        "role": "viewer",
        "name": "Read Only Viewer"
    }
}


@router.post("/login")
def login(payload: LoginRequest):
    user = USERS.get(payload.username)

    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "username": payload.username,
        "role": user["role"],
        "name": user["name"]
    }
