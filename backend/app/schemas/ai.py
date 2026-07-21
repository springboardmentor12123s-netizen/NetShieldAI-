from pydantic import BaseModel


class PredictionRequest(BaseModel):
    data: dict


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    risk: str
    threat_type: str
    recommendation: str