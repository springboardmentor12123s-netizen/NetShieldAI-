from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Team, User
from app.schemas.team import TeamCreate, TeamResponse
from app.utils.permissions import require_role

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


# --------------------------------
# Create Team (Admin Only)
# --------------------------------
@router.post("/", response_model=TeamResponse)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin"]))
):

    existing_team = db.query(Team).filter(
        Team.team_name == team.team_name
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="Team already exists"
        )

    new_team = Team(
        team_name=team.team_name,
        description=team.description
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team


# --------------------------------
# Get All Teams
# --------------------------------
@router.get("/", response_model=list[TeamResponse])
def get_all_teams(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Security Analyst"])
    )
):

    teams = db.query(Team).all()

    return teams


# --------------------------------
# Assign User to Team (Admin Only)
# --------------------------------
@router.put("/{team_id}/assign/{user_id}")
def assign_user_to_team(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["Admin"]))
):

    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.team_id = team.id

    db.commit()
    db.refresh(user)

    return {
        "message": "User assigned successfully",
        "user": user.full_name,
        "team": team.team_name
    }