"""NetShield AI - Request Logging Middleware."""

import time
import uuid
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with timing and unique request ID."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path

        start_time = time.perf_counter()

        logger.info(f"[{request_id}] → {method} {path} from {client_ip}")

        try:
            response = await call_next(request)
        except Exception as exc:
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"[{request_id}] ✗ {method} {path} failed after {duration:.1f}ms: {exc}"
            )
            raise

        duration = (time.perf_counter() - start_time) * 1000
        logger.info(
            f"[{request_id}] ← {method} {path} → {response.status_code} [{duration:.1f}ms]"
        )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.1f}ms"
        return response
