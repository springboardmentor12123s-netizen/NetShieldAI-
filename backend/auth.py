import datetime
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from typing import Optional
from typing import Optional

from .database import get_db
from .models import User

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "netshield_super_secret_key"
ALGORITHM = "HS256"

security = HTTPBearer()

class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str
    role: str = "Analyst"
    gmail_app_password: Optional[str] = None
    gmail_app_password: Optional[str] = None

class LoginSchema(BaseModel):
    username: str
    password: str

# Helper to verify token and return payload
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature or expired token",
        )

@router.post("/register")
def register_user(data: RegisterSchema, db: Session = Depends(get_db)):
    # Check if username exists
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email address already exists to prevent SQL database IntegrityError
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email address already registered")
    
    # Hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(data.password.encode('utf-8'), salt).decode('utf-8')
    
    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=hashed,
        role=data.role,
        gmail_app_password=data.gmail_app_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully", "user": new_user.username}

@router.post("/login")
def login_user(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify hash
    try:
        matches = bcrypt.checkpw(data.password.encode('utf-8'), user.password_hash.encode('utf-8'))
    except Exception:
        matches = False
        
    if not matches:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create JWT token
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    payload = {
        "sub": user.username,
        "role": user.role,
        "exp": expire
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}

class SmtpUpdateSchema(BaseModel):
    gmail_app_password: str

@router.post("/profile/smtp")
def update_smtp_password(data: SmtpUpdateSchema, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.gmail_app_password = data.gmail_app_password
    db.commit()
    return {"message": "Gmail App Password updated successfully!"}
