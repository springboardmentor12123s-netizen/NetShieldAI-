from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Role
from schemas import UserCreate, UserLogin, Token, UserResponse
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Operator ID already registered")
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    hashed_pwd = hash_password(user.password)
    
    # Fetch the default "SOC_Analyst" role
    default_role = db.query(Role).filter(Role.name == "SOC_Analyst").first()
    
    # Create the new user object
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd,
        role_id=default_role.id if default_role else None
    )
    
    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # Find the user by username
    db_user = db.query(User).filter(User.username == user.username).first()
    
    # Verify user exists and password is correct
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid Operator ID or Access Key")
    
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Operator account is locked")
    
    # Create JWT token
    access_token = create_access_token(data={"sub": db_user.username, "role": str(db_user.role_id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }