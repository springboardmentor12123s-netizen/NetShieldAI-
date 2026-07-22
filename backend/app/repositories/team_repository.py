"""NetShield AI - Team Repository."""

from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team import Team, TeamMember
from app.models.user import User
from app.repositories.base_repository import BaseRepository


class TeamRepository(BaseRepository[Team]):
    """Repository for Team model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(Team, session)

    async def get_by_name(self, name: str) -> Optional[Team]:
        """Find team by name."""
        result = await self.session.execute(
            select(Team).where(Team.name == name)
        )
        return result.scalar_one_or_none()

    async def get_with_members(self, team_id: UUID) -> Optional[Team]:
        """Get team with all members loaded."""
        result = await self.session.execute(
            select(Team)
            .options(
                selectinload(Team.team_members).selectinload(TeamMember.user)
            )
            .where(Team.id == team_id)
        )
        return result.scalar_one_or_none()

    async def get_all_with_member_count(
        self,
        skip: int = 0,
        limit: int = 20,
        department: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[List[dict], int]:
        """Get all teams with member counts."""
        query = (
            select(Team, func.count(TeamMember.id).label("member_count"))
            .outerjoin(TeamMember, TeamMember.team_id == Team.id)
            .group_by(Team.id)
        )
        count_query = select(func.count()).select_from(Team)

        if department:
            query = query.where(Team.department == department)
            count_query = count_query.where(Team.department == department)

        if is_active is not None:
            query = query.where(Team.is_active == is_active)
            count_query = count_query.where(Team.is_active == is_active)

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        query = query.order_by(Team.name).offset(skip).limit(limit)
        result = await self.session.execute(query)
        rows = result.all()

        return [{"team": row[0], "member_count": row[1]} for row in rows], total

    async def add_member(self, team_id: UUID, user_id: UUID, role_in_team: str = "member") -> TeamMember:
        """Add a user to a team."""
        member = TeamMember(team_id=team_id, user_id=user_id, role_in_team=role_in_team)
        self.session.add(member)
        await self.session.flush()
        await self.session.refresh(member)
        return member

    async def remove_member(self, team_id: UUID, user_id: UUID) -> bool:
        """Remove a user from a team."""
        result = await self.session.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            return False
        await self.session.delete(member)
        await self.session.flush()
        return True

    async def is_member(self, team_id: UUID, user_id: UUID) -> bool:
        """Check if user is a member of team."""
        result = await self.session.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none() is not None
