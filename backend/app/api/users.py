from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.database import get_postgres
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate
from app.auth.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserOut])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_postgres), current_user: User = Depends(require_admin)):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: UUID, payload: UserUpdate, db: AsyncSession = Depends(get_postgres), current_user: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user
