from pydantic import BaseModel


class TeamCreate(BaseModel):
    team_name: str
    description: str | None = None


class TeamResponse(BaseModel):
    id: int
    team_name: str
    description: str | None = None

    class Config:
        from_attributes = True