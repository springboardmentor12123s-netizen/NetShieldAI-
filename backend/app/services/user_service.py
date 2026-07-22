from sqlalchemy.orm import Session
from app.database.models import User
from app.auth.password import hash_password


def register_user(db: Session, user_data):
    # Check username
    existing_user = db.query(User).filter(User.username == user_data.username).first()

    if existing_user:
        return None

    # Check email
    existing_email = db.query(User).filter(User.email == user_data.email).first()

    if existing_email:
        return None

    new_user = User(
        full_name=user_data.full_name,
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password),
        role="User"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user