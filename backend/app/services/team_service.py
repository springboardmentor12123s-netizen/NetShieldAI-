"""NetShield AI - Team Service."""

import logging
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, DuplicateError
from app.repositories.team_repository import TeamRepository
from app.repositories.audit_repository import AuditRepository
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse, TeamListResponse,
    TeamMemberAdd, TeamMemberResponse,
)

logger = logging.getLogger("app")


class TeamService:
    """Business logic for team management."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.team_repo = TeamRepository(session)
        self.audit_repo = AuditRepository(session)

    async def create_team(
        self, data: TeamCreate, created_by: Optional[UUID] = None, ip: Optional[str] = None
    ) -> TeamResponse:
        existing = await self.team_repo.get_by_name(data.name)
        if existing:
            raise DuplicateError("team name")

        team = await self.team_repo.create(data.model_dump())
        await self.audit_repo.create_log(
            user_id=created_by, action="create", resource="team",
            resource_id=str(team.id), new_values=data.model_dump(), ip_address=ip,
        )
        return TeamResponse(
            id=team.id, name=team.name, department=team.department,
            description=team.description, is_active=team.is_active,
            member_count=0, members=[], created_at=team.created_at, updated_at=team.updated_at,
        )

    async def get_team(self, team_id: UUID) -> TeamResponse:
        team = await self.team_repo.get_with_members(team_id)
        if not team:
            raise NotFoundError("Team", str(team_id))
        members = [
            TeamMemberResponse(
                id=m.id, user_id=m.user_id,
                user_email=m.user.email if m.user else None,
                user_name=m.user.full_name if m.user else None,
                role_in_team=m.role_in_team, joined_at=m.joined_at,
            )
            for m in team.team_members
        ]
        return TeamResponse(
            id=team.id, name=team.name, department=team.department,
            description=team.description, is_active=team.is_active,
            member_count=len(members), members=members,
            created_at=team.created_at, updated_at=team.updated_at,
        )

    async def list_teams(
        self, page: int = 1, per_page: int = 20,
        department: Optional[str] = None, is_active: Optional[bool] = None,
    ) -> tuple[List[TeamListResponse], int]:
        skip = (page - 1) * per_page
        rows, total = await self.team_repo.get_all_with_member_count(
            skip=skip, limit=per_page, department=department, is_active=is_active,
        )
        items = [
            TeamListResponse(
                id=r["team"].id, name=r["team"].name, department=r["team"].department,
                is_active=r["team"].is_active, member_count=r["member_count"],
                created_at=r["team"].created_at,
            )
            for r in rows
        ]
        return items, total

    async def update_team(
        self, team_id: UUID, data: TeamUpdate,
        updated_by: Optional[UUID] = None, ip: Optional[str] = None,
    ) -> TeamResponse:
        team = await self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundError("Team", str(team_id))

        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data and update_data["name"] != team.name:
            existing = await self.team_repo.get_by_name(update_data["name"])
            if existing:
                raise DuplicateError("team name")

        await self.team_repo.update(team_id, update_data)
        await self.audit_repo.create_log(
            user_id=updated_by, action="update", resource="team",
            resource_id=str(team_id), new_values=update_data, ip_address=ip,
        )
        return await self.get_team(team_id)

    async def delete_team(
        self, team_id: UUID, deleted_by: Optional[UUID] = None, ip: Optional[str] = None,
    ) -> None:
        team = await self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundError("Team", str(team_id))
        await self.audit_repo.create_log(
            user_id=deleted_by, action="delete", resource="team",
            resource_id=str(team_id), old_values={"name": team.name}, ip_address=ip,
        )
        await self.team_repo.delete(team_id)

    async def add_member(
        self, team_id: UUID, data: TeamMemberAdd,
        added_by: Optional[UUID] = None, ip: Optional[str] = None,
    ) -> TeamMemberResponse:
        team = await self.team_repo.get_by_id(team_id)
        if not team:
            raise NotFoundError("Team", str(team_id))
        if await self.team_repo.is_member(team_id, data.user_id):
            raise DuplicateError("team membership")

        member = await self.team_repo.add_member(team_id, data.user_id, data.role_in_team)
        await self.audit_repo.create_log(
            user_id=added_by, action="add_member", resource="team",
            resource_id=str(team_id), new_values={"user_id": str(data.user_id)}, ip_address=ip,
        )
        return TeamMemberResponse(
            id=member.id, user_id=member.user_id,
            role_in_team=member.role_in_team, joined_at=member.joined_at,
        )

    async def remove_member(
        self, team_id: UUID, user_id: UUID,
        removed_by: Optional[UUID] = None, ip: Optional[str] = None,
    ) -> None:
        removed = await self.team_repo.remove_member(team_id, user_id)
        if not removed:
            raise NotFoundError("Team member")
        await self.audit_repo.create_log(
            user_id=removed_by, action="remove_member", resource="team",
            resource_id=str(team_id), old_values={"user_id": str(user_id)}, ip_address=ip,
        )
