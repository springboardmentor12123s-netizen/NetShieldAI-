"""
NetShield AI — SQLAlchemy ORM models.

All models share the same declarative Base and use timezone-aware
UTC timestamps via the utc_now() helper.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


class DatasetRecord(Base):
    """Tracks every CSV file uploaded for training or prediction."""

    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    original_name: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255), unique=True)
    purpose: Mapped[str] = mapped_column(String(30), default="training")
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    normal_count: Mapped[int] = mapped_column(Integer, default=0)
    attack_count: Mapped[int] = mapped_column(Integer, default=0)
    prediction_count: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TrainingRun(Base):
    """Records model performance metrics from each training run."""

    __tablename__ = "training_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"))
    accuracy: Mapped[float] = mapped_column(Float)
    precision: Mapped[float] = mapped_column(Float)
    recall: Mapped[float] = mapped_column(Float)
    f1_score: Mapped[float] = mapped_column(Float)
    tn: Mapped[int] = mapped_column(Integer)
    fp: Mapped[int] = mapped_column(Integer)
    fn: Mapped[int] = mapped_column(Integer)
    tp: Mapped[int] = mapped_column(Integer)
    feature_count: Mapped[int] = mapped_column(Integer)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Alert(Base):
    """Represents a single anomalous row detected during a prediction run."""

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"))
    row_number: Mapped[int] = mapped_column(Integer)
    prediction: Mapped[str] = mapped_column(String(30), default="Anomaly")
    severity: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ThreatReport(Base):
    """Stores the aggregated threat analysis report after each prediction run."""

    __tablename__ = "threat_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    total_records: Mapped[int] = mapped_column(Integer, default=0)
    normal_count: Mapped[int] = mapped_column(Integer, default=0)
    suspicious_count: Mapped[int] = mapped_column(Integer, default=0)
    anomaly_count: Mapped[int] = mapped_column(Integer, default=0)
    anomaly_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="Low")
    # Optional supervised metrics — populated when the CSV has a Label column.
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Full report payload serialised as JSON for easy retrieval.
    report_json: Mapped[str | None] = mapped_column(Text, nullable=True)
