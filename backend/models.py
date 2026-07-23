from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Analyst")  # Admin, Analyst, Auditor


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(String, nullable=False)  # Critical, High, Medium, Low
    message = Column(String, nullable=False)
    source_ip = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)
    status = Column(String, default="Active")  # Active, Investigating, Resolved

    incidents = relationship("Incident", back_populates="alert")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    assigned_to = Column(String, nullable=True)
    status = Column(String, default="Open")  # Open, Closed

    alert = relationship("Alert", back_populates="incidents")
