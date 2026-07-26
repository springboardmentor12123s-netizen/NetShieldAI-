from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
mongo_db = mongo_client[settings.MONGODB_DB]

async def get_postgres() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

async def init_postgres():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def init_mongo_indexes():
    t = mongo_db.traffic
    await t.create_index("timestamp")
    await t.create_index("source_ip")
    await t.create_index("label")
    await t.create_index("dataset_source")
    await t.create_index([("source_ip", 1), ("timestamp", -1)])
