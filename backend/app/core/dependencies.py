"""NetShield AI - Dependency Injection (Auth, DB, Role Checks)."""

from typing import List, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_async_session
from app.core.security import decode_token
from app.core.redis import JWTBlacklist
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    TokenExpiredError,
    TokenRevokedError,
)

settings = get_settings()
security_scheme = HTTPBearer()


async def get_db(session: AsyncSession = Depends(get_async_session)) -> AsyncSession:
    """Provide database session dependency."""
    return session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    """Extract and validate current user from JWT access token.

    Returns:
        Dict with user claims: sub, role, permissions, jti
    """
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError:
        raise AuthenticationError("Invalid or expired token")

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    jti = payload.get("jti")
    try:
        if jti and await JWTBlacklist.is_blacklisted(jti):
            raise TokenRevokedError()
    except (RuntimeError, Exception) as e:
        # Redis may not be available; skip blacklist check
        if isinstance(e, TokenRevokedError):
            raise

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload")

    return {
        "user_id": user_id,
        "role": payload.get("role", ""),
        "permissions": payload.get("permissions", []),
        "jti": jti,
    }


def require_roles(allowed_roles: List[str]):
    """Dependency factory: require user to have one of the specified roles."""

    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user["role"].lower()
        allowed_normalized = [r.lower() for r in allowed_roles]
        
        is_authorized = user_role in allowed_normalized
        if not is_authorized:
            if user_role == "analyst" and "security_analyst" in allowed_normalized:
                is_authorized = True
            elif user_role == "security_analyst" and "analyst" in allowed_normalized:
                is_authorized = True

        if not is_authorized:
            raise AuthorizationError(
                f"Role '{current_user['role']}' is not authorized. Required: {allowed_roles}"
            )
        return current_user

    return role_checker


def require_permission(resource: str, action: str):
    """Dependency factory: require user to have a specific permission."""

    async def permission_checker(current_user: dict = Depends(get_current_user)) -> dict:
        required = f"{resource}:{action}"
        if required not in current_user.get("permissions", []):
            raise AuthorizationError(f"Missing permission: {required}")
        return current_user

    return permission_checker


async def get_optional_user(
    request: Request,
) -> Optional[dict]:
    """Get current user if authenticated, None otherwise."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        if jti and await JWTBlacklist.is_blacklisted(jti):
            return None
        return {
            "user_id": payload.get("sub"),
            "role": payload.get("role", ""),
            "permissions": payload.get("permissions", []),
            "jti": jti,
        }
    except JWTError:
        return None
