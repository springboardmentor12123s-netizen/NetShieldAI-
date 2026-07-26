from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class TrafficBase(BaseModel):
    timestamp: datetime
    source_ip: str
    source_port: Optional[int] = None
    destination_ip: str
    destination_port: Optional[int] = None
    protocol: Optional[str] = None
    dataset_source: str
    label: str
    is_anomaly: bool = False
    predicted_label: Optional[str] = None
    anomaly_score: Optional[float] = None
    is_anomaly_predicted: Optional[bool] = None
    risk_score: Optional[int] = None
    prediction_confidence: Optional[float] = None
    features: Dict[str, Any] = Field(default_factory=dict)

class TrafficOut(TrafficBase):
    id: str = Field(alias="_id")
    created_at: datetime
    class Config:
        populate_by_name = True
        from_attributes = True

class TrafficQuery(BaseModel):
    skip: int = 0
    limit: int = 100
    source_ip: Optional[str] = None
    label: Optional[str] = None
    dataset_source: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
