from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_postgres
from app.models.user import User, Role
from app.schemas.user import Token, UserCreate, UserOut
from app.auth.security import verify_password, create_access_token, get_password_hash
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_postgres)):
    result = await db.execute(select(User).options(selectinload(User.role)).where(User.username == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.name if user.role else None})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_postgres)):
    existing = await db.execute(select(User).where((User.username == payload.username) | (User.email == payload.email)))
    if existing.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already registered")
    role_res = await db.execute(select(Role).where(Role.name == "viewer"))
    role = role_res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Default role not found")
    user = User(username=payload.username, email=payload.email, full_name=payload.full_name,
                hashed_password=get_password_hash(payload.password), role_id=role.id)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
