from sqlalchemy import Column, Integer, String,Float
from app.database.database import Base

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