from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func

from app.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)

    source_ip = Column(String, nullable=False)

    destination_ip = Column(String, nullable=False)

    anomaly_type = Column(String, nullable=False)

    confidence_score = Column(Float, nullable=False)

    severity = Column(String, nullable=False, default="MEDIUM")

    protocol = Column(String, nullable=False, default="UNKNOWN")

    status = Column(String, default="Detected")

    email_sent = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
