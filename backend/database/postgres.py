from sqlalchemy import Boolean, Column, DateTime, Integer, String, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os

load_dotenv()


def _normalize_database_url(raw_url: str) -> str:
    candidate = (raw_url or "").strip()
    if not candidate:
        raise ValueError("POSTGRES_URL is required and must point to the Supabase PostgreSQL database.")

    if "://" not in candidate:
        candidate = f"postgresql+psycopg2://{candidate}"

    if candidate.startswith("postgres://"):
        candidate = candidate.replace("postgres://", "postgresql+psycopg2://", 1)
    elif candidate.startswith("postgresql://"):
        candidate = candidate.replace("postgresql://", "postgresql+psycopg2://", 1)

    if "@" not in candidate:
        raise ValueError(
            "POSTGRES_URL must be a full PostgreSQL URL like "
            "postgresql+psycopg2://user:password@host:5432/dbname"
        )

    if "supabase" in candidate.lower() and "sslmode=" not in candidate:
        separator = "&" if "?" in candidate else "?"
        candidate = f"{candidate}{separator}sslmode=require"

    return candidate


# BYPASS ENVIRONMENT VARIABLES ENTIRELY
RAW_DATABASE_URL = os.getenv("POSTGRES_URL")
normalized_url = _normalize_database_url(RAW_DATABASE_URL)
engine_kwargs = {"pool_pre_ping": True}
if "supabase" in normalized_url.lower():
    engine_kwargs["connect_args"] = {"sslmode": "require"}

engine = create_engine(normalized_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    username = Column(String)
    event = Column(String)
    severity = Column(String)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
