from sqlalchemy import Column, String, Boolean, ForeignKey, Float, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

# Create the Base class for our models
Base = declarative_base()

# Role Model
class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    permissions = Column(String, nullable=True)
    
    # Relationship: One Role can have many Users
    users = relationship("User", back_populates="role")

# User Model
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationship: Many Users belong to One Role
    role = relationship("Role", back_populates="users")

# Alert Model (NEW!)
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flow_id = Column(String, nullable=True) # Reference to the MongoDB flow ID
    severity = Column(String(10), nullable=False) # 'Critical', 'High', 'Medium', 'Low'
    threat_type = Column(String(50), nullable=False) # 'DDoS', 'PortScan', 'BruteForce'
    risk_score = Column(Float, nullable=False) # 0.0 to 1.0 (from the AI engine)
    status = Column(String(20), default="New") # 'New', 'Investigating', 'Resolved', 'False Positive'
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)