from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class NetworkPacket(Base):
    __tablename__ = "network_packets"

    id = Column(Integer, primary_key=True, index=True)

    source_ip = Column(String, nullable=False)

    destination_ip = Column(String, nullable=False)

    protocol = Column(String, nullable=False)

    packet_size = Column(Integer, nullable=False)

    status = Column(String, default="Normal")

    created_at = Column(DateTime(timezone=True), server_default=func.now())