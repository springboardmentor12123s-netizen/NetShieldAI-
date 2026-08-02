from sqlalchemy import Column, Integer, String,Float, DateTime
from app.database.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, nullable=False)

    username = Column(String, unique=True, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)

    role = Column(String, default="User")



from sqlalchemy import Column, Integer, Float, String
from app.database.database import Base


class NetworkTraffic(Base):
    __tablename__ = "network_traffic"

    id = Column(Integer, primary_key=True, index=True)

    destination_port = Column(Integer)
    flow_duration = Column(Float)

    total_fwd_packets = Column(Integer)
    total_backward_packets = Column(Integer)

    total_length_fwd_packets = Column(Float)
    total_length_backward_packets = Column(Float)

    flow_bytes_per_sec = Column(Float)
    flow_packets_per_sec = Column(Float)

    label = Column(String(100))





class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    source_ip = Column(String(50), nullable=False)

    destination_ip = Column(String(50), nullable=False)

    protocol = Column(String(20), nullable=False)

    attack_type = Column(String(100), nullable=False)

    severity = Column(String(20), nullable=False)

    status = Column(String(30), default="OPEN")

    detected_at = Column(
        DateTime,
        default=datetime.utcnow
    )