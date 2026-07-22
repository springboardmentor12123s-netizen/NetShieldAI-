"""NetShield AI - System Configuration Model."""

import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class SystemConfig(Base, UUIDMixin, TimestampMixin):
    """Key-value system configuration stored in DB."""

    __tablename__ = "system_config"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general")
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    def __repr__(self) -> str:
        return f"<SystemConfig(key={self.key})>"
