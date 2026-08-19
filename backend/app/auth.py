"""Password hashing + JWT auth helpers + role-based access control."""
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import users_collection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, remember_me: bool = False) -> str:
    to_encode = data.copy()
    minutes = settings.remember_me_expire_minutes if remember_me else settings.access_token_expire_minutes
    expire = datetime.utcnow() + timedelta(minutes=minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_reset_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.reset_token_expire_minutes)
    payload = {"sub": email, "purpose": "password_reset", "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_reset_token(token: str) -> str:
    """Returns the email the reset token was issued for, or raises HTTPException."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("purpose") != "password_reset":
            raise JWTError("wrong token purpose")
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been disabled")
    return user


def require_role(*allowed_roles: str):
    """FastAPI dependency factory for RBAC, e.g. Depends(require_role('admin'))."""

    async def _check(current_user=Depends(get_current_user)):
        if current_user.get("role", "security_analyst") not in allowed_roles:
            raise HTTPException(status_code=403, detail="You do not have permission to do this")
        return current_user

    return _check
