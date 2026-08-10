from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    password = Column(String(255), nullable=False)

    role = Column(
        String(50),
        nullable=False,
        default="ADMIN",
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    is_first_login = Column(
        Boolean,
        default=True,
    )

    password_reset_token = Column(
        String(255),
        nullable=True,
    )

    password_reset_expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    last_login = Column(
        DateTime(timezone=True),
        nullable=True,
    )
