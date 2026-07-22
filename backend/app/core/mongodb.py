"""NetShield AI - Async MongoDB Client (Motor)."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

settings = get_settings()


class MongoDBManager:
    """Manages MongoDB connection lifecycle."""

    client: AsyncIOMotorClient | None = None
    database: AsyncIOMotorDatabase | None = None

    @classmethod
    async def connect(cls) -> None:
        """Initialize MongoDB connection."""
        cls.client = AsyncIOMotorClient(
            settings.MONGO_URL,
            maxPoolSize=50,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,
        )
        cls.database = cls.client[settings.MONGO_DB]

    @classmethod
    async def disconnect(cls) -> None:
        """Close MongoDB connection."""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.database = None

    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """Get the MongoDB database instance."""
        if cls.database is None:
            raise RuntimeError("MongoDB not initialized. Call connect() first.")
        return cls.database

    @classmethod
    def get_collection(cls, name: str):
        """Get a MongoDB collection by name."""
        db = cls.get_database()
        return db[name]


# Alias for readiness check
mongodb_manager = MongoDBManager


async def get_mongodb() -> AsyncIOMotorDatabase:
    """Dependency for MongoDB database."""
    return MongoDBManager.get_database()
