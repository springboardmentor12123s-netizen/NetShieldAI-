
import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    anomaly_result_id = Column(String, ForeignKey("anomaly_results.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    severity = Column(String, default="low")
    risk_score = Column(Float, default=0.0)

    status = Column(Enum(AlertStatus), default=AlertStatus.OPEN)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    anomaly_result = relationship("AnomalyResult")
    assignee = relationship("User")