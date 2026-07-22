from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "NetShieldAI"

ALGORITHM = "HS256"


def create_token(username):

    expire = datetime.utcnow() + timedelta(hours=2)

    payload = {
        "sub": username,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token