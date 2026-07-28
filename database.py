import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Using SQLite by default -> no separate database server install needed.
# It just creates a file called netshield.db in the backend folder.
#
# If you later want PostgreSQL instead, install it and set a .env line like:
# DATABASE_URL=postgresql://netshield_user:yourpassword@localhost:5432/netshield_db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./netshield.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
