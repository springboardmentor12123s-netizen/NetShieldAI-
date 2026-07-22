"""NetShield AI - Custom Exceptions and HTTP Error Handlers."""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone


class NetShieldException(Exception):
    """Base exception for NetShield AI."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class AuthenticationError(NetShieldException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, code="AUTHENTICATION_ERROR")


class AuthorizationError(NetShieldException):
    """Raised when user lacks permission."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message=message, code="AUTHORIZATION_ERROR")


class NotFoundError(NetShieldException):
    """Raised when resource is not found."""

    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with id '{resource_id}' not found"
        super().__init__(message=message, code="NOT_FOUND")


class ValidationError(NetShieldException):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation failed", details: Optional[List[Dict]] = None):
        self.details = details or []
        super().__init__(message=message, code="VALIDATION_ERROR")


class RateLimitError(NetShieldException):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(message=message, code="RATE_LIMITED")


class AccountLockedError(NetShieldException):
    """Raised when account is locked due to too many failed attempts."""

    def __init__(self, message: str = "Account is locked. Please try again later."):
        super().__init__(message=message, code="ACCOUNT_LOCKED")


class TokenExpiredError(NetShieldException):
    """Raised when token has expired."""

    def __init__(self, message: str = "Token has expired"):
        super().__init__(message=message, code="TOKEN_EXPIRED")


class TokenRevokedError(NetShieldException):
    """Raised when token has been revoked."""

    def __init__(self, message: str = "Token has been revoked"):
        super().__init__(message=message, code="TOKEN_REVOKED")


class DuplicateError(NetShieldException):
    """Raised when a unique constraint is violated."""

    def __init__(self, field: str = "resource"):
        super().__init__(message=f"{field} already exists", code="DUPLICATE_ERROR")


def _error_response(status_code: int, code: str, message: str, details: Any = None) -> JSONResponse:
    """Create a standardized error response."""
    body: Dict[str, Any] = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body)


async def netshield_exception_handler(request: Request, exc: NetShieldException) -> JSONResponse:
    """Handle NetShield custom exceptions."""
    status_map = {
        "AUTHENTICATION_ERROR": 401,
        "AUTHORIZATION_ERROR": 403,
        "NOT_FOUND": 404,
        "VALIDATION_ERROR": 422,
        "RATE_LIMITED": 429,
        "ACCOUNT_LOCKED": 423,
        "TOKEN_EXPIRED": 401,
        "TOKEN_REVOKED": 401,
        "DUPLICATE_ERROR": 409,
        "INTERNAL_ERROR": 500,
    }
    status_code = status_map.get(exc.code, 500)
    details = getattr(exc, "details", None)
    return _error_response(status_code, exc.code, exc.message, details)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions with consistent format."""
    return _error_response(exc.status_code, "HTTP_ERROR", str(exc.detail))


import logging
logger = logging.getLogger("app")

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception(f"Unexpected error occurred in request {request.method} {request.url.path}: {exc}")
    return _error_response(500, "INTERNAL_ERROR", "An unexpected error occurred")


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers with FastAPI application."""
    app.add_exception_handler(NetShieldException, netshield_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

