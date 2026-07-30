from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os
# Make sure your actual password is in this URL
load_dotenv

# 2. Use os.getenv() to fetch the value assigned to POSTGRES_URL in your .env file
SQLALCHEMY_DATABASE_URL = os.getenv(
    "POSTGRES_URL", 
    "postgresql://postgres:fallback_password@localhost:5432/netshield_users"
)


engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- ADD THIS USER BLUEPRINT ---
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
    severity = Column(String) # e.g., "Info", "Warning", "Critical"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()