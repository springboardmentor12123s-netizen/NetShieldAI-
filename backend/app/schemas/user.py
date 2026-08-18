from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: Optional[str] = None


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.ANALYST
    team_id: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    team_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Public self-service signup. Lets the user select their role
    (analyst, SOC team lead, enterprise viewer, or admin) at signup time."""
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.ANALYST


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut