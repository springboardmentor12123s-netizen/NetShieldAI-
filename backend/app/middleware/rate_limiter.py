"""NetShield AI - Rate Limiting Middleware."""

import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.redis import RateLimiter
from app.core.config import get_settings
from app.core.exceptions import RateLimitError

logger = logging.getLogger("app.security")
settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis sliding window."""

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        # Determine rate limit based on endpoint
        if path.startswith("/api/v1/auth"):
            max_requests = settings.AUTH_RATE_LIMIT_PER_MINUTE
            key = f"{client_ip}:auth"
        else:
            max_requests = settings.RATE_LIMIT_PER_MINUTE
            key = f"{client_ip}:global"

        try:
            allowed, remaining = await RateLimiter.check_rate_limit(key, max_requests)
        except Exception:
            # If Redis is down, allow the request but log the error
            logger.warning(f"Rate limiter unavailable for {client_ip}")
            allowed, remaining = True, max_requests

        if not allowed:
            logger.warning(f"Rate limit exceeded for {client_ip} on {path}")
            raise RateLimitError()

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
