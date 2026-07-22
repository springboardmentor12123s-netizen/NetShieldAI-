from sqlalchemy.orm import Session

from app.database.models import User
from app.auth.jwt_handler import create_token
from app.auth.password import verify_password


def login(db: Session, username: str, password: str):

    user = db.query(User).filter(User.username == username).first()

    if user and verify_password(password, user.password):

        token = create_token(user.username)

        return {
            "token": token,
            "role": user.role
        }

    return None