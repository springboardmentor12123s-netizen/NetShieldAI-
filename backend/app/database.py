import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv

# Load .env file if present so DATABASE_URL can be set there during development.
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

# PostgreSQL does not need check_same_thread.
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
