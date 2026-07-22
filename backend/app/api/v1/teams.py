"""NetShield AI - Teams API Routes."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_roles
from app.services.team_service import TeamService
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse, TeamListResponse, TeamMemberAdd, TeamMemberResponse
from app.schemas.common import APIResponse, PaginatedResponse, MessageResponse

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.get("", response_model=PaginatedResponse[TeamListResponse])
async def list_teams(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    service = TeamService(db)
    teams, total = await service.list_teams(page, per_page, department, is_active)
    return PaginatedResponse.create(teams, total, page, per_page)


@router.post("", response_model=APIResponse[TeamResponse], status_code=201)
async def create_team(data: TeamCreate, request: Request, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    service = TeamService(db)
    team = await service.create_team(data, created_by=UUID(current_user["user_id"]), ip=request.client.host if request.client else None)
    return APIResponse(data=team)


@router.get("/{team_id}", response_model=APIResponse[TeamResponse])
async def get_team(team_id: UUID, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_roles(["admin", "security_analyst"]))):
    service = TeamService(db)
    team = await service.get_team(team_id)
    return APIResponse(data=team)


@router.put("/{team_id}", response_model=APIResponse[TeamResponse])
async def update_team(team_id: UUID, data: TeamUpdate, request: Request, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    service = TeamService(db)
    team = await service.update_team(team_id, data, updated_by=UUID(current_user["user_id"]), ip=request.client.host if request.client else None)
    return APIResponse(data=team)


@router.delete("/{team_id}", response_model=MessageResponse)
async def delete_team(team_id: UUID, request: Request, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    service = TeamService(db)
    await service.delete_team(team_id, deleted_by=UUID(current_user["user_id"]), ip=request.client.host if request.client else None)
    return MessageResponse(message="Team deleted successfully")


@router.post("/{team_id}/members", response_model=APIResponse[TeamMemberResponse], status_code=201)
async def add_team_member(team_id: UUID, data: TeamMemberAdd, request: Request, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    service = TeamService(db)
    member = await service.add_member(team_id, data, added_by=UUID(current_user["user_id"]), ip=request.client.host if request.client else None)
    return APIResponse(data=member)


@router.delete("/{team_id}/members/{user_id}", response_model=MessageResponse)
async def remove_team_member(team_id: UUID, user_id: UUID, request: Request, db: AsyncSession = Depends(get_db), current_user: dict = Depends(require_roles(["admin"]))):
    service = TeamService(db)
    await service.remove_member(team_id, user_id, removed_by=UUID(current_user["user_id"]), ip=request.client.host if request.client else None)
    return MessageResponse(message="Member removed successfully")
