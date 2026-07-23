"""
NetShield AI — Authentication router.

Uses a simple in-memory credential store intentionally; this project
is a local college demo and does not require persistent user accounts
or token-based authentication.
"""

from fastapi import APIRouter, HTTPException

from app.schemas import LoginRequest

router = APIRouter(tags=["Authentication"])

# In-memory credential store — role and display name are returned on login.
USERS: dict[str, dict] = {
    "admin": {
        "password": "admin123",
        "role": "admin",
        "name": "System Admin",
    },
    "analyst": {
        "password": "analyst123",
        "role": "analyst",
        "name": "Security Analyst",
    },
    "viewer": {
        "password": "viewer123",
        "role": "viewer",
        "name": "Read Only Viewer",
    },
}


@router.post("/login")
def login(payload: LoginRequest):
    """Validate credentials and return the user's role and display name."""
    user = USERS.get(payload.username)

    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "username": payload.username,
        "role": user["role"],
        "name": user["name"],
    }
