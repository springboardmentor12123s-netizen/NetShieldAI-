
from dotenv import load_dotenv
import os

from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "netshield_app_data")


def _resolve_database_name() -> str:
    name = (MONGO_DB_NAME or "netshield_app_data").strip()
    return name or "netshield_app_data"


try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[_resolve_database_name()]
    db.list_collection_names()
except Exception:
    client = None
    db = None


def get_mongo_db():
    return db