from fastapi import APIRouter, HTTPException

from data.teams import teams
from data.audit_logs import audit_logs

router = APIRouter()


@router.get("/teams")
def get_teams():
    return teams


@router.post("/teams")
def create_team(team: dict):

    new_team = {
        "id": len(teams) + 1,
        "team_name": team["team_name"],
        "leader": team["leader"],
        "members": team["members"],
    }

    teams.append(new_team)

    audit_logs.append(
        {
            "id": len(audit_logs) + 1,
            "user": team["leader"],
            "action": f'Created Team "{team["team_name"]}"',
        }
    )

    return {
        "message": "Team Created Successfully",
        "team": new_team,
    }


@router.put("/teams/{team_id}")
def update_team(team_id: int, updated_team: dict):

    for team in teams:

        if team["id"] == team_id:

            team["team_name"] = updated_team["team_name"]
            team["leader"] = updated_team["leader"]
            team["members"] = updated_team["members"]

            audit_logs.append(
                {
                    "id": len(audit_logs) + 1,
                    "user": updated_team["leader"],
                    "action": f'Updated Team "{updated_team["team_name"]}"',
                }
            )

            return {
                "message": "Team Updated Successfully",
                "team": team,
            }

    raise HTTPException(
        status_code=404,
        detail="Team not found",
    )


@router.delete("/teams/{team_id}")
def delete_team(team_id: int):

    for team in teams:

        if team["id"] == team_id:

            teams.remove(team)

            audit_logs.append(
                {
                    "id": len(audit_logs) + 1,
                    "user": team["leader"],
                    "action": f'Deleted Team "{team["team_name"]}"',
                }
            )

            return {
                "message": "Team Deleted Successfully",
            }

    raise HTTPException(
        status_code=404,
        detail="Team not found",
    )