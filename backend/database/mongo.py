import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
    client.admin.command("ping")
    db = client.netshield_app_data
except Exception:
    client = None
    db = None


def get_mongo_db():
    return db