"""
NetShield AI — SQLAlchemy database engine and session factory.

DATABASE_URL must be set as an environment variable (or in backend/.env)
before the server starts.  Only PostgreSQL connection strings are accepted.
"""

import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv

# Load .env so DATABASE_URL can be configured during local development.
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

if not DATABASE_URL:
    sys.exit(
        "\n[NetShield AI] ERROR: DATABASE_URL is not set.\n"
        "Please configure your PostgreSQL connection string before starting the server.\n"
        "Example:\n"
        "  DATABASE_URL=postgresql://postgres:password@localhost:5432/netshield_ai\n"
        "Set it in backend/.env or export it as an environment variable.\n"
    )

if not DATABASE_URL.startswith("postgresql"):
    sys.exit(
        "\n[NetShield AI] ERROR: DATABASE_URL must be a PostgreSQL connection string.\n"
        f"  Received: {DATABASE_URL}\n"
        "Expected format: postgresql://user:password@host:port/dbname\n"
    )

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Yield a database session and ensure it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
