from datetime import datetime, timedelta

from jose import jwt

from app.config import SECRET_KEY, ALGORITHM


def create_invitation_token(email: str, role: str):

    expire = datetime.utcnow() + timedelta(days=2)

    payload = {
        "sub": email,
        "role": role,
        "type": "invite",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def verify_invitation_token(token: str):

    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )