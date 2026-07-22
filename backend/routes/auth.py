from fastapi import APIRouter, HTTPException

from models.login import LoginRequest
from data.users import users

router = APIRouter()


@router.post("/login")
def login(login_data: LoginRequest):

    for user in users:
        if (
            user["email"] == login_data.email
            and user["password"] == login_data.password
        ):
            return {
                "message": "Login Successful",
                "name": user["name"],
                "role": user["role"]
            }

    raise HTTPException(
        status_code=401,
        detail="Invalid Email or Password"
    )