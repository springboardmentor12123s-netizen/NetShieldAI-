from sqlalchemy import Boolean, Column, Integer, String, DateTime, func
from database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String)
    disabled = Column(Boolean, default=False)

class Incident(Base):
    __tablename__ = "incidents"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, nullable=False)
    source_ip = Column(String(50), nullable=False)
    status = Column(String(20), default="New", nullable=False)
    assigned_to = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    event = Column(String)
    severity = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())