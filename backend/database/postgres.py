from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from dotenv import load_dotenv
# Make sure your actual password is in this URL
SQLALCHEMY_DATABASE_URL = "POSTGRES_URL"

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