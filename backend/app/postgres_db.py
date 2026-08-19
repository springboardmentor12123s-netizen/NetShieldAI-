"""
========================================================================
 OPTIONAL POSTGRESQL CONNECTION LAYER (kept ready, not required)
========================================================================
NetShield AI's primary database is MongoDB (see database.py). This module
exists so PostgreSQL can be plugged in later (e.g. for relational
reporting) WITHOUT migrating any existing data and WITHOUT ever blocking
the app from starting if Postgres isn't configured.

Setup, when you're ready:
    1. pip install sqlalchemy[asyncio] asyncpg
    2. In backend/.env set:
         POSTGRES_URI=postgresql+asyncpg://<user>:<password>@<host>:5432/<db>
    3. Restart the backend. /api/settings will report "connected": true
       once it can reach it. Nothing else in the app depends on this.

Until POSTGRES_URI is set, get_postgres_engine() returns None everywhere
it's used, and every caller treats that as "Postgres not configured" —
never as an error.
========================================================================
"""
from functools import lru_cache
from typing import Optional

from app.config import settings


@lru_cache
def get_postgres_engine() -> Optional[object]:
    """Lazily create an async SQLAlchemy engine if POSTGRES_URI is set.

    Returns None (never raises) when Postgres isn't configured or the
    optional driver packages aren't installed — callers must handle None.
    """
    if not settings.postgres_uri:
        return None
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        return create_async_engine(settings.postgres_uri, echo=False, pool_pre_ping=True)
    except ImportError:
        # sqlalchemy / asyncpg not installed — Postgres stays optional.
        return None
    except Exception:
        return None


async def check_postgres_connection() -> bool:
    """Used by /api/settings to report Postgres status. Never raises."""
    engine = get_postgres_engine()
    if engine is None:
        return False
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
