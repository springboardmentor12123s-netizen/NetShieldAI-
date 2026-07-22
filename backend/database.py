from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./netshield.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(String, default="analyst")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    prediction = Column(String)          # e.g. "DoS", "DDoS"
    risk_score = Column(Integer)
    severity = Column(String)            # Low / Medium / High / Critical
    detected_by = Column(String)         # username who triggered the prediction
    status = Column(String, default="Open")   # "Open" or "Resolved"
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)