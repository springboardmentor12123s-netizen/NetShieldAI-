from sqlalchemy import Column, DateTime, Integer, String, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os

load_dotenv()


def _normalize_database_url(raw_url: str) -> str:
    candidate = (raw_url or "").strip()
    if not candidate:
        candidate = "postgresql+psycopg2://postgres:postgres@localhost:5432/netshield_users"

    if "://" not in candidate:
        candidate = f"postgresql+psycopg2://{candidate}"

    if candidate.startswith("postgres://"):
        candidate = candidate.replace("postgres://", "postgresql+psycopg2://", 1)
    elif candidate.startswith("postgresql://"):
        candidate = candidate.replace("postgresql://", "postgresql+psycopg2://", 1)

    if "@" not in candidate and not candidate.startswith("sqlite"):
        raise ValueError(
            "POSTGRES_URL must be a full PostgreSQL URL like "
            "postgresql+psycopg2://user:password@host:5432/dbname"
        )

    if "supabase" in candidate.lower() and "sslmode=" not in candidate:
        separator = "&" if "?" in candidate else "?"
        candidate = f"{candidate}{separator}sslmode=require"

    return candidate


SQLALCHEMY_DATABASE_URL = os.getenv(
    "POSTGRES_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/netshield_users",
)

try:
    normalized_url = _normalize_database_url(SQLALCHEMY_DATABASE_URL)
    engine = create_engine(normalized_url, pool_pre_ping=True)
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
except Exception as exc:
    print(
        "Warning: PostgreSQL connection failed. Using a fallback in-memory SQLite database for startup. "
        f"Details: {exc}"
    )
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="Security Analyst")


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
