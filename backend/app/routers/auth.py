from fastapi import APIRouter, HTTPException

from app.schemas import LoginRequest

router = APIRouter(tags=["Authentication"])


@router.post("/login")
def login(credentials: LoginRequest):
    if credentials.username != "admin" or credentials.password != "admin123":
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return {"success": True, "username": credentials.username}
