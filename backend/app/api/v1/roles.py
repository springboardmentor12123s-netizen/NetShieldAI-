"""NetShield AI - Roles & Permissions API Routes."""

from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, require_roles
from app.services.role_service import RoleService
from app.schemas.role import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleListResponse,
    PermissionResponse,
    PermissionCreate,
    PermissionUpdate,
    RolePermissionMatrixEntry,
)
from app.schemas.common import APIResponse, MessageResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=APIResponse[List[RoleListResponse]])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """List all system roles (Admin only)."""
    service = RoleService(db)
    roles = await service.list_roles()
    return APIResponse(data=roles)


@router.post("", response_model=APIResponse[RoleResponse], status_code=201)
async def create_role(
    data: RoleCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Create a new role (Admin only)."""
    service = RoleService(db)
    role = await service.create_role(
        data,
        created_by=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return APIResponse(data=role)


@router.get("/permissions", response_model=APIResponse[List[PermissionResponse]])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """List all system permissions (Admin only)."""
    service = RoleService(db)
    perms = await service.get_all_permissions()
    return APIResponse(data=perms)


@router.post("/permissions", response_model=APIResponse[PermissionResponse], status_code=201)
async def create_permission(
    data: PermissionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Create a new target permission (Admin only)."""
    service = RoleService(db)
    perm = await service.create_permission(
        data,
        created_by=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return APIResponse(data=perm)


@router.get("/permissions/{permission_id}", response_model=APIResponse[PermissionResponse])
async def get_permission_by_id(
    permission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Get permission detail (Admin only)."""
    service = RoleService(db)
    perm = await service.get_permission(permission_id)
    return APIResponse(data=perm)


@router.put("/permissions/{permission_id}", response_model=APIResponse[PermissionResponse])
async def update_permission(
    permission_id: UUID,
    data: PermissionUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Update permission detail (Admin only)."""
    service = RoleService(db)
    perm = await service.update_permission(
        permission_id,
        data,
        updated_by=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return APIResponse(data=perm)


@router.delete("/permissions/{permission_id}", response_model=MessageResponse)
async def delete_permission(
    permission_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Delete permission (Admin only)."""
    service = RoleService(db)
    await service.delete_permission(
        permission_id,
        deleted_by=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return MessageResponse(message="Permission deleted successfully")


@router.get("/matrix", response_model=APIResponse[List[RolePermissionMatrixEntry]])
async def get_role_permission_matrix(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Fetch complete mapping matrix of which roles map to what permissions (Admin only)."""
    service = RoleService(db)
    matrix = await service.get_role_permission_matrix()
    return APIResponse(data=matrix)


@router.get("/{role_id}", response_model=APIResponse[RoleResponse])
async def get_role(
    role_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Get role details (Admin only)."""
    service = RoleService(db)
    role = await service.get_role(role_id)
    return APIResponse(data=role)


@router.put("/{role_id}", response_model=APIResponse[RoleResponse])
async def update_role(
    role_id: UUID,
    data: RoleUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Update role details and its permissions list (Admin only)."""
    service = RoleService(db)
    role = await service.update_role(
        role_id,
        data,
        updated_by=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return APIResponse(data=role)


@router.delete("/{role_id}", response_model=MessageResponse)
async def delete_role(
    role_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Delete role (Admin only). System roles are blocked."""
    service = RoleService(db)
    await service.delete_role(
        role_id,
        deleted_by=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return MessageResponse(message="Role deleted successfully")


@router.post("/{role_id}/permissions", response_model=APIResponse[RoleResponse])
async def assign_permissions_to_role(
    role_id: UUID,
    request: Request,
    permission_ids: List[UUID] = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Assign permissions to a role (Admin only)."""
    service = RoleService(db)
    role = await service.assign_permissions(
        role_id=role_id,
        permission_ids=permission_ids,
        operator_id=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return APIResponse(data=role)


@router.delete("/{role_id}/permissions", response_model=APIResponse[RoleResponse])
async def remove_permissions_from_role(
    role_id: UUID,
    request: Request,
    permission_ids: List[UUID] = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin"])),
):
    """Remove permissions from a role (Admin only)."""
    service = RoleService(db)
    role = await service.remove_permissions(
        role_id=role_id,
        permission_ids=permission_ids,
        operator_id=UUID(current_user["user_id"]),
        ip=request.client.host if request.client else None,
    )
    return APIResponse(data=role)
