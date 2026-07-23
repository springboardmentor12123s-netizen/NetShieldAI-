import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pymongo import MongoClient

# --- SQL Relational Database Setup (SQLite/PostgreSQL) ---
# For local simplicity and human evaluation, we default to SQLite.
SQLALCHEMY_DATABASE_URL = "sqlite:///./netshield_sql.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- NoSQL Database Setup (MongoDB) ---
# Fallback to in-memory/mock client if MongoDB is not running locally
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

class MockMongoCollection:
    def __init__(self):
        self.data = []
    
    def insert_one(self, item):
        self.data.append(item)
        return True
        
    def find(self, query=None, limit=100):
        return self.data[:limit]

class MockMongoDB:
    def __init__(self):
        self.packets = MockMongoCollection()
        self.telemetry = MockMongoCollection()

try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Check connection
    mongo_client.server_info()
    mongo_db = mongo_client["netshield_nosql"]
    print("Successfully connected to MongoDB!")
except Exception:
    print("MongoDB not running. Falling back to simple mock MongoDB storage.")
    mongo_db = MockMongoDB()
