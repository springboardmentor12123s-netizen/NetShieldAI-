from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    team_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    message: str
    users: list[UserResponse]


class Token(BaseModel):
    access_token: str
    token_type: str