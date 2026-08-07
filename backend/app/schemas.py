from pydantic import BaseModel
from typing import Optional

# Schema for data required to create a user
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# Schema for data required to login
class UserLogin(BaseModel):
    username: str
    password: str

# Schema for data returned to the frontend (NEVER return the password!)
class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True # Allows reading data from SQLAlchemy models

# Schema for the JWT Token response
class Token(BaseModel):
    access_token: str
    token_type: str

    # Schema for data required to create a new Alert
class AlertCreate(BaseModel):
    flow_id: str
    severity: str
    threat_type: str
    risk_score: float

# Schema for data returned to the frontend
class AlertResponse(BaseModel):
    id: str
    flow_id: str
    severity: str
    threat_type: str
    risk_score: float
    status: str
    created_at: str

    class Config:
        from_attributes = True