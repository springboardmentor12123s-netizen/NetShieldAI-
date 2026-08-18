from sqlalchemy import Boolean, Column, DateTime, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os

load_dotenv()

def _normalize_database_url(raw_url: str) -> str:
    candidate = (raw_url or "").strip()
    if not candidate:
        raise ValueError("DATABASE_URL is missing. Please provide your Neon Database URL.")

    if "://" not in candidate:
        candidate = f"postgresql+psycopg2://{candidate}"

    if candidate.startswith("postgres://"):
        candidate = candidate.replace("postgres://", "postgresql+psycopg2://", 1)
    elif candidate.startswith("postgresql://"):
        candidate = candidate.replace("postgresql://", "postgresql+psycopg2://", 1)

    if "@" not in candidate:
        raise ValueError(
            "DATABASE_URL must be a full PostgreSQL URL like "
            "postgresql+psycopg2://user:password@host:5432/dbname"
        )

    # Neon always requires sslmode=require
    if "sslmode=" not in candidate:
        separator = "&" if "?" in candidate else "?"
        candidate = f"{candidate}{separator}sslmode=require"

    return candidate


# BYPASS ENVIRONMENT VARIABLES ENTIRELY FOR RENDER
RAW_DATABASE_URL = "postgresql://neondb_owner:npg_U5vDnfVTGs9z@ep-noisy-cloud-ay8rjeip-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"

normalized_url = _normalize_database_url(RAW_DATABASE_URL)

# Enforce secure connection args for Neon
engine_kwargs = {
    "pool_pre_ping": True,
    "connect_args": {"sslmode": "require"}
}

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