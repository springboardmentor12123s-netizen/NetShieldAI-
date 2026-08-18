from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.postgres import get_db

# 1. Security Configuration
SECRET_KEY = "netshield-key"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

router = APIRouter()


# 2. Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str


# 3. Mock Database
fake_users_db = {
    "admin@netshield.com": {
        "username": "admin@netshield.com",
        "full_name": "Security Admin",
        "email": "admin@netshield.com",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "Administrator",
        "disabled": False,
    }
}


# 4. Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=120))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(username: str, password: str):
    user_data = fake_users_db.get(username)
    if not user_data:
        return None
    if not verify_password(password, user_data["hashed_password"]):
        return None
    return user_data


# 5. Routes
@router.post("/login")
def login(user_credentials: UserLoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_credentials.username).first()
    
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Inject username AND role into the signed JWT payload
    access_token = create_access_token(
        data={
            "sub": user.username,
            "role": user.role  # <-- Role is securely encoded into JWT
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role  # Returned to Next.js for client-side state
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    if user.email in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_pwd = pwd_context.hash(user.password)
    fake_users_db[user.email] = {
        "username": user.email,
        "full_name": user.full_name,
        "email": user.email,
        "hashed_password": hashed_pwd,
        "role": user.role,
        "disabled": False,
    }

    return {"message": "User successfully created", "email": user.email, "role": user.role}