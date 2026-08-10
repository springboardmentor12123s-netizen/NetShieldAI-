from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = os.getenv("ALGORITHM")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
)

SMTP_SERVER = os.getenv("SMTP_SERVER")

SMTP_PORT = int(
    os.getenv("SMTP_PORT")
)

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")

EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)
