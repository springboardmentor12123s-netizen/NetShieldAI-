from pydantic import BaseModel


class AnomalyCreate(BaseModel):
    source_ip: str
    destination_ip: str
    anomaly_type: str
    confidence_score: float
    status: str = "Detected"