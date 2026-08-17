from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


# --------------------------------
# USER
# --------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="Security Analyst")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    team = relationship("Team", back_populates="members")


# --------------------------------
# TEAM
# --------------------------------

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    members = relationship("User", back_populates="team")


# --------------------------------
# AUDIT LOG
# --------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_email = Column(String, nullable=False)

    action = Column(String, nullable=False)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# --------------------------------
# SECURITY ALERT
# --------------------------------

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    source = Column(
        String,
        nullable=True
    )

    destination = Column(
        String,
        nullable=True
    )

    protocol = Column(
        String,
        nullable=True
    )

    prediction = Column(
        String,
        nullable=True
    )

    risk = Column(
        String,
        nullable=True
    )

    threat = Column(
        String,
        nullable=True
    )

    recommendation = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="Open"
    )