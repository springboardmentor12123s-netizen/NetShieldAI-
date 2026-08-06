"""NetShield AI - Incident Model."""

import uuid
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Incident(Base, UUIDMixin, TimestampMixin):
    """Incident management model."""

    __tablename__ = "incidents"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # low, medium, high, critical
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="open", index=True) # open, investigating, resolved, closed
    
    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    assigned_to: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<Incident(id={self.id}, title={self.title}, status={self.status})>"
