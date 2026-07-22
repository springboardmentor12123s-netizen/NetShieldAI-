from fastapi import APIRouter
from data.users import users

router = APIRouter()


@router.get("/users")
def get_users():
    return users