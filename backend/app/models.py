"""Pydantic request/response schemas."""
import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

ROLES = ("admin", "security_analyst")


def password_strength(password: str) -> dict:
    """Simple, dependency-free password strength check used by both the
    register endpoint and the frontend strength meter."""
    score = 0
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if re.search(r"[A-Z]", password):
        score += 1
    if re.search(r"[a-z]", password):
        score += 1
    if re.search(r"\d", password):
        score += 1
    if re.search(r"[^A-Za-z0-9]", password):
        score += 1
    label = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong", "Excellent"][min(score, 6)]
    return {"score": score, "max_score": 6, "label": label}


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if password_strength(v)["score"] < 3:
            raise ValueError("Password is too weak — mix upper/lowercase, numbers, and symbols")
        return v


class UserOut(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "security_analyst"
    is_active: bool = True


class UserAdminOut(UserOut):
    id: str
    created_at: Optional[datetime] = None


class UserUpdateRole(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        if v not in ROLES:
            raise ValueError(f"role must be one of {ROLES}")
        return v


class UserUpdateActive(BaseModel):
    is_active: bool


class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if len(v) < 8 or password_strength(v)["score"] < 3:
            raise ValueError("New password is too weak")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if len(v) < 8 or password_strength(v)["score"] < 3:
            raise ValueError("New password is too weak")
        return v


class PredictionRequest(BaseModel):
    duration: float
    protocol_type: str          # tcp / udp / icmp
    src_bytes: float
    dst_bytes: float
    packet_count: int
    flow_rate: float
    wrong_fragment: int = 0
    urgent: int = 0
    count: int = 1
    srv_count: int = 1
    source_ip: Optional[str] = "0.0.0.0"
    destination_ip: Optional[str] = "0.0.0.0"
    source_port: Optional[int] = None
    destination_port: Optional[int] = None


class PredictionResult(BaseModel):
    prediction_id: str
    is_attack: bool
    attack_type: str
    confidence: float
    risk_score: float
    threat_level: str
    recommended_actions: List[str]
    source_ip: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AlertOut(BaseModel):
    id: str
    source_ip: str
    attack_type: str
    risk_score: float
    severity: str
    recommendation: str
    resolved: bool
    false_positive: bool = False
    created_at: datetime


class AppSettingsUpdate(BaseModel):
    ai_confidence_threshold: Optional[float] = None
    theme: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    notify_on_critical: Optional[bool] = None
