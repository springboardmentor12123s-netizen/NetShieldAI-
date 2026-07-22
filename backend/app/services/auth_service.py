"""NetShield AI - Auth Service."""

import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_password_complexity,
)
from app.core.redis import JWTBlacklist
from app.core.exceptions import (
    AuthenticationError,
    AccountLockedError,
    ValidationError,
    TokenRevokedError,
)
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.session_repository import SessionRepository, RefreshTokenRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.auth import LoginResponse, AuthUser, RefreshResponse

settings = get_settings()
security_logger = logging.getLogger("app.security")
audit_logger = logging.getLogger("app.audit")


class AuthService:
    """Business logic for authentication."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.role_repo = RoleRepository(session)
        self.session_repo = SessionRepository(session)
        self.refresh_repo = RefreshTokenRepository(session)
        self.audit_repo = AuditRepository(session)

    async def login(
        self, email: str, password: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> LoginResponse:
        """Authenticate user and return tokens."""
        user = await self.user_repo.get_by_email(email)

        if not user:
            security_logger.warning(f"Login attempt for non-existent email: {email} from {ip_address}")
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            security_logger.warning(f"Login attempt for deactivated user: {email}")
            raise AuthenticationError("Account is deactivated")

        # Check account lockout
        if user.is_locked and user.locked_until:
            if user.locked_until > datetime.now(timezone.utc):
                security_logger.warning(f"Login attempt for locked account: {email}")
                raise AccountLockedError()
            else:
                await self.user_repo.reset_failed_attempts(user.id)

        # Verify password
        if not verify_password(password, user.hashed_password):
            await self.user_repo.increment_failed_attempts(user.id)

            if user.failed_login_attempts + 1 >= settings.MAX_LOGIN_ATTEMPTS:
                user.is_locked = True
                user.locked_until = datetime.now(timezone.utc) + timedelta(
                    minutes=settings.LOCKOUT_DURATION_MINUTES
                )
                await self.session.flush()
                security_logger.critical(f"Account locked due to brute force: {email}")

            security_logger.warning(
                f"Failed login attempt #{user.failed_login_attempts + 1} for {email} from {ip_address}"
            )
            raise AuthenticationError("Invalid email or password")

        # Reset failed attempts on success
        await self.user_repo.reset_failed_attempts(user.id)

        # Get permissions
        permissions = await self.role_repo.get_permissions_for_role(user.role_id)

        # Create tokens
        access_token, access_jti, access_expires = create_access_token(
            subject=str(user.id),
            role=user.role.name,
            permissions=permissions,
        )
        refresh_token_str, refresh_jti, family_id, refresh_expires = create_refresh_token(
            subject=str(user.id),
        )

        # Store session
        token_hash = hashlib.sha256(access_token.encode()).hexdigest()
        await self.session_repo.create({
            "user_id": user.id,
            "token_hash": token_hash,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "expires_at": access_expires,
        })

        # Store refresh token
        refresh_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
        await self.refresh_repo.create({
            "user_id": user.id,
            "token_hash": refresh_hash,
            "family_id": family_id,
            "expires_at": refresh_expires,
        })

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await self.session.flush()

        # Audit log
        await self.audit_repo.create_log(
            user_id=user.id,
            action="login",
            resource="auth",
            ip_address=ip_address,
            user_agent=user_agent,
            details=f"User {email} logged in successfully",
        )

        security_logger.info(f"Successful login: {email} from {ip_address}")

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=AuthUser(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                role=user.role.name,
                permissions=permissions,
            ),
        )

    async def logout(
        self, jti: str, user_id: str, ip_address: Optional[str] = None
    ) -> None:
        """Logout user by blacklisting token and revoking sessions."""
        # Blacklist access token in Redis
        ttl = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        await JWTBlacklist.add(jti, ttl)

        # Revoke refresh tokens
        from uuid import UUID
        uid = UUID(user_id)
        await self.refresh_repo.revoke_all_for_user(uid)
        await self.session_repo.revoke_all_for_user(uid)

        # Audit log
        await self.audit_repo.create_log(
            user_id=uid,
            action="logout",
            resource="auth",
            ip_address=ip_address,
            details="User logged out",
        )

        security_logger.info(f"User {user_id} logged out")

    async def refresh_tokens(self, refresh_token_str: str) -> RefreshResponse:
        """Refresh access token using rotation with family tracking."""
        try:
            payload = decode_token(refresh_token_str)
        except Exception:
            raise AuthenticationError("Invalid refresh token")

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
        stored_token = await self.refresh_repo.get_by_token_hash(token_hash)

        if not stored_token:
            raise AuthenticationError("Refresh token not found")

        if stored_token.is_revoked:
            # Token reuse detected — revoke entire family
            await self.refresh_repo.revoke_by_family(stored_token.family_id)
            security_logger.critical(
                f"Refresh token reuse detected for user {stored_token.user_id}, family {stored_token.family_id}"
            )
            raise TokenRevokedError("Token has been revoked — possible theft detected")

        if stored_token.expires_at < datetime.now(timezone.utc):
            raise AuthenticationError("Refresh token has expired")

        # Revoke old token
        stored_token.is_revoked = True
        await self.session.flush()

        # Get user and permissions
        user = await self.user_repo.get_by_id_with_relations(stored_token.user_id)
        if not user or not user.is_active:
            raise AuthenticationError("User account is not active")

        permissions = await self.role_repo.get_permissions_for_role(user.role_id)

        # Create new token pair (same family)
        new_access, _, access_expires = create_access_token(
            subject=str(user.id),
            role=user.role.name,
            permissions=permissions,
        )
        new_refresh, _, _, refresh_expires = create_refresh_token(
            subject=str(user.id),
            family_id=stored_token.family_id,
        )

        # Store new refresh token
        new_hash = hashlib.sha256(new_refresh.encode()).hexdigest()
        await self.refresh_repo.create({
            "user_id": user.id,
            "token_hash": new_hash,
            "family_id": stored_token.family_id,
            "expires_at": refresh_expires,
        })

        return RefreshResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
