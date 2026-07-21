from pydantic import BaseModel
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    action: str
    timestamp: datetime

    class Config:
        from_attributes = True