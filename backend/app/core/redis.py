"""NetShield AI - Redis Connection Manager."""

import redis.asyncio as aioredis
from typing import Optional

from app.core.config import get_settings

settings = get_settings()


class RedisManager:
    """Manages Redis connection pool lifecycle."""

    pool: Optional[aioredis.Redis] = None
    _available: bool = False

    @classmethod
    async def connect(cls) -> None:
        """Initialize Redis connection pool."""
        cls.pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=50,
        )
        # Test connection immediately
        await cls.pool.ping()
        cls._available = True

    @classmethod
    async def disconnect(cls) -> None:
        """Close Redis connection pool."""
        cls._available = False
        if cls.pool:
            await cls.pool.close()
            cls.pool = None

    @classmethod
    def get_client(cls) -> aioredis.Redis:
        """Get Redis client instance."""
        if cls.pool is None:
            raise RuntimeError("Redis not initialized. Call connect() first.")
        return cls.pool

    @classmethod
    async def is_available(cls) -> bool:
        """Check if Redis connection is active and reachable."""
        if cls.pool is None:
            return False
        try:
            await cls.pool.ping()
            cls._available = True
            return True
        except Exception:
            cls._available = False
            return False


async def get_redis() -> aioredis.Redis:
    """Dependency for Redis client."""
    return RedisManager.get_client()


class _RedisManagerProxy:
    """Proxy for readiness check access."""
    @property
    def _client(self):
        return RedisManager.pool

redis_manager = _RedisManagerProxy()


class JWTBlacklist:
    """Redis-backed JWT token blacklist."""

    PREFIX = "blacklist:"

    @classmethod
    async def add(cls, jti: str, ttl_seconds: int) -> None:
        """Add a token JTI to the blacklist."""
        if not RedisManager._available:
            return
        try:
            client = RedisManager.get_client()
            await client.setex(f"{cls.PREFIX}{jti}", ttl_seconds, "1")
        except Exception as e:
            # Redis connection lost
            RedisManager._available = False

    @classmethod
    async def is_blacklisted(cls, jti: str) -> bool:
        """Check if a token JTI is blacklisted."""
        if not RedisManager._available:
            return False
        try:
            client = RedisManager.get_client()
            result = await client.get(f"{cls.PREFIX}{jti}")
            return result is not None
        except Exception:
            RedisManager._available = False
            return False


class RateLimiter:
    """Redis-backed sliding window rate limiter."""

    PREFIX = "rate:"

    @classmethod
    async def check_rate_limit(
        cls,
        key: str,
        max_requests: int,
        window_seconds: int = 60,
    ) -> tuple[bool, int]:
        """Check if request is within rate limit.

        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        if not RedisManager._available:
            return True, max_requests

        try:
            client = RedisManager.get_client()
            redis_key = f"{cls.PREFIX}{key}"

            current = await client.get(redis_key)
            if current is None:
                await client.setex(redis_key, window_seconds, 1)
                return True, max_requests - 1

            count = int(current)
            if count >= max_requests:
                return False, 0

            await client.incr(redis_key)
            return True, max_requests - count - 1
        except Exception:
            RedisManager._available = False
            return True, max_requests


class CacheManager:
    """Redis-backed cache with TTL."""

    PREFIX = "cache:"

    @classmethod
    async def get(cls, key: str) -> Optional[str]:
        """Get cached value."""
        if not RedisManager._available:
            return None
        try:
            client = RedisManager.get_client()
            return await client.get(f"{cls.PREFIX}{key}")
        except Exception:
            RedisManager._available = False
            return None

    @classmethod
    async def set(cls, key: str, value: str, ttl_seconds: int = 300) -> None:
        """Set cached value with TTL."""
        if not RedisManager._available:
            return
        try:
            client = RedisManager.get_client()
            await client.setex(f"{cls.PREFIX}{key}", ttl_seconds, value)
        except Exception:
            RedisManager._available = False

    @classmethod
    async def delete(cls, key: str) -> None:
        """Delete cached value."""
        if not RedisManager._available:
            return
        try:
            client = RedisManager.get_client()
            await client.delete(f"{cls.PREFIX}{key}")
        except Exception:
            RedisManager._available = False

    @classmethod
    async def delete_pattern(cls, pattern: str) -> None:
        """Delete all keys matching pattern."""
        if not RedisManager._available:
            return
        try:
            client = RedisManager.get_client()
            async for key in client.scan_iter(f"{cls.PREFIX}{pattern}"):
                await client.delete(key)
        except Exception:
            RedisManager._available = False

