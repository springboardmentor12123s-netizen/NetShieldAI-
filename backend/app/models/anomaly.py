from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)

    source_ip = Column(String, nullable=False)

    destination_ip = Column(String, nullable=False)

    anomaly_type = Column(String, nullable=False)

    confidence_score = Column(Float, nullable=False)

    status = Column(String, default="Detected")

    created_at = Column(DateTime(timezone=True), server_default=func.now())