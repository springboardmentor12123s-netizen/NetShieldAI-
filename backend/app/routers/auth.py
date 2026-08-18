
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import LoginRequest, TokenResponse, UserOut, UserCreate, SignupRequest
from app.auth.security import verify_password, create_access_token, hash_password
from app.auth.dependencies import get_current_user, require_roles
from app.utils.audit import log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, request: Request, db: Session = Depends(get_db)):
   
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(subject=new_user.id, role=new_user.role.value)
    log_action(db, new_user.id, "SIGNUP", f"{new_user.email} self-registered", request.client.host if request.client else "")

    return TokenResponse(access_token=token, user=UserOut.model_validate(new_user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token(subject=user.id, role=user.role.value)
    log_action(db, user.id, "LOGIN", f"{user.email} logged in", request.client.host if request.client else "")

    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.ADMIN)),
):
 
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        team_id=payload.team_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, admin.id, "USER_CREATED", f"Created user {new_user.email} with role {new_user.role.value}")
    return new_user
