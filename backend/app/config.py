from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://netshield:netshield@localhost:5432/netshield"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "netshield"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:5173"
    class Config:
        env_file = ".env"

@lru_cache
def get_settings(): return Settings()
