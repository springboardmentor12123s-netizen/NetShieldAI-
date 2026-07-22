"""NetShield AI - Unit Tests for TeamService."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest
from uuid import uuid4

from app.core.exceptions import NotFoundError, DuplicateError
from app.services.team_service import TeamService
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate, TeamMemberAdd


@pytest.mark.asyncio
async def test_create_team_success(mock_db_session):
    """Test successful creation of a SOC department team."""
    team_service = TeamService(mock_db_session)
    team_service.team_repo = AsyncMock()
    team_service.audit_repo = AsyncMock()

    team_id = uuid4()
    mock_team = Team(
        id=team_id,
        name="Red Team",
        department="Security operations",
        description="Offensive Security Analyst Group",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    team_service.team_repo.get_by_name.return_value = None
    team_service.team_repo.create.return_value = mock_team

    create_data = TeamCreate(
        name="Red Team",
        department="Security operations",
        description="Offensive Security Analyst Group",
    )

    result = await team_service.create_team(create_data, created_by=uuid4(), ip="127.0.0.1")

    assert result.name == "Red Team"
    assert result.department == "Security operations"
    team_service.team_repo.create.assert_called_once()
    team_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_create_team_duplicate_name(mock_db_session):
    """Test team creation raises DuplicateError on name conflict."""
    team_service = TeamService(mock_db_session)
    team_service.team_repo = AsyncMock()

    team_service.team_repo.get_by_name.return_value = Team(id=uuid4(), name="SOC Team Alpha")

    create_data = TeamCreate(name="SOC Team Alpha", department="SecOps")
    with pytest.raises(DuplicateError):
        await team_service.create_team(create_data)


@pytest.mark.asyncio
async def test_get_team_not_found(mock_db_session):
    """Test get_team raises NotFoundError on invalid team ID."""
    team_service = TeamService(mock_db_session)
    team_service.team_repo = AsyncMock()
    team_service.team_repo.get_with_members.return_value = None

    with pytest.raises(NotFoundError):
        await team_service.get_team(uuid4())


@pytest.mark.asyncio
async def test_add_member_success(mock_db_session):
    """Test adding a user to a team."""
    team_service = TeamService(mock_db_session)
    team_service.team_repo = AsyncMock()
    team_service.audit_repo = AsyncMock()

    team_id = uuid4()
    user_id = uuid4()
    mock_team = Team(id=team_id, name="Blue Team", department="Defensive Ops")
    mock_member = TeamMember(
        id=uuid4(),
        team_id=team_id,
        user_id=user_id,
        role_in_team="analyst",
        joined_at=datetime.now(timezone.utc),
    )

    team_service.team_repo.get_by_id.return_value = mock_team
    team_service.team_repo.is_member.return_value = False
    team_service.team_repo.add_member.return_value = mock_member

    add_data = TeamMemberAdd(user_id=user_id, role_in_team="analyst")
    result = await team_service.add_member(team_id, add_data, added_by=uuid4())

    assert result.user_id == user_id
    assert result.role_in_team == "analyst"
    team_service.team_repo.add_member.assert_called_once_with(team_id, user_id, "analyst")
    team_service.audit_repo.create_log.assert_called_once()


@pytest.mark.asyncio
async def test_add_member_duplicate_fails(mock_db_session):
    """Test adding a user who is already a member throws DuplicateError."""
    team_service = TeamService(mock_db_session)
    team_service.team_repo = MagicMock()

    team_id = uuid4()
    user_id = uuid4()
    mock_team = Team(id=team_id)

    # Use async helper or mock repo for async methods
    team_service.team_repo.get_by_id = AsyncMock(return_value=mock_team)
    team_service.team_repo.is_member = AsyncMock(return_value=True)

    add_data = TeamMemberAdd(user_id=user_id)
    with pytest.raises(DuplicateError):
        await team_service.add_member(team_id, add_data)


@pytest.mark.asyncio
async def test_remove_member_success(mock_db_session):
    """Test successful removal from team membership."""
    team_service = TeamService(mock_db_session)
    team_service.team_repo = AsyncMock()
    team_service.audit_repo = AsyncMock()

    team_id = uuid4()
    user_id = uuid4()
    team_service.team_repo.remove_member.return_value = True

    await team_service.remove_member(team_id, user_id, removed_by=uuid4())

    team_service.team_repo.remove_member.assert_called_once_with(team_id, user_id)
    team_service.audit_repo.create_log.assert_called_once()
