"""NetShield AI - Pytest Configurations and Global Fixtures."""

from unittest.mock import AsyncMock, MagicMock
import pytest
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def mock_db_session():
    """Mock SQLAlchemy AsyncSession for unit testing services."""
    session = MagicMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.add = MagicMock()
    session.delete = MagicMock()
    return session


@pytest.fixture
def mock_user():
    """Return a mock dictionary representing user schema data."""
    return {
        "id": "e2ba286f-2ef4-4fdb-935f-00ecf79d1a81",
        "email": "test-analyst@netshield.io",
        "full_name": "Test Analyst",
        "is_active": True,
        "role": "Analyst",
        "permissions": ["traffic:read", "dashboard:read", "system:read"],
    }
