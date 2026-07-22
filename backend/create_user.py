from database import SessionLocal, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

users_to_create = [
    {"username": "admin1", "password": "adminpass123", "role": "admin"},
    {"username": "analyst1", "password": "password123", "role": "analyst"},
]

for u in users_to_create:
    existing = db.query(User).filter(User.username == u["username"]).first()
    if existing:
        print(f"User '{u['username']}' already exists.")
    else:
        hashed_password = pwd_context.hash(u["password"])
        new_user = User(username=u["username"], hashed_password=hashed_password, role=u["role"])
        db.add(new_user)
        db.commit()
        print(f"User '{u['username']}' created successfully with role '{u['role']}'!")

db.close()