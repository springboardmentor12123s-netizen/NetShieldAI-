"""NetShield AI - Security Utilities (JWT, Password Hashing)."""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import uuid

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with 12 rounds."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    role: str,
    permissions: list[str] | None = None,
    extra_claims: Dict[str, Any] | None = None,
) -> tuple[str, str, datetime]:
    """Create a JWT access token.

    Returns:
        Tuple of (token, jti, expires_at)
    """
    jti = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": subject,
        "jti": jti,
        "role": role,
        "permissions": permissions or [],
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at


def create_refresh_token(
    subject: str,
    family_id: Optional[str] = None,
) -> tuple[str, str, str, datetime]:
    """Create a JWT refresh token with family tracking for rotation.

    Returns:
        Tuple of (token, jti, family_id, expires_at)
    """
    jti = str(uuid.uuid4())
    if family_id is None:
        family_id = str(uuid.uuid4())

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": subject,
        "jti": jti,
        "family_id": family_id,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, family_id, expires_at


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token.

    Raises:
        JWTError: If token is invalid or expired.
    """
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def validate_password_complexity(password: str) -> list[str]:
    """Validate password meets complexity requirements.

    Returns:
        List of validation error messages (empty if valid).
    """
    errors = []
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")
    return errors
