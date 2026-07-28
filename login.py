from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth_utils import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Login"])


@router.post("/login", response_model=schemas.TokenResponse)
def login_user(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token({"sub": user.email, "role": user.role.value})

    db.add(models.AuditLog(user_email=user.email, action="USER_LOGIN"))
    db.commit()

    return schemas.TokenResponse(access_token=token, user=user)
