from dotenv import load_dotenv
import os

# 1. Swap MongoClient for the asynchronous Motor client
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "netshield_app_data")


def _resolve_database_name() -> str:
    name = (MONGO_DB_NAME or "netshield_app_data").strip()
    return name or "netshield_app_data"


try:
    # 2. Connect using AsyncIOMotorClient
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[_resolve_database_name()]
    
    # We removed the synchronous ping and list_collection_names here 
    # because motor operations must be awaited inside an async function, 
    # and running them at the root level will block the event loop.
    print("Successfully connected to asynchronous MongoDB instance.")

except Exception as e:
    print(f"MongoDB connection failed: {e}")
    client = None
    db = None


def get_mongo_db():
    return db