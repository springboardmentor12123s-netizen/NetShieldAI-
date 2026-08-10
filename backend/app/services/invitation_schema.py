from pydantic import BaseModel


class AcceptInvitation(BaseModel):
    token: str
    full_name: str
    password: str