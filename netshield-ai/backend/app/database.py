"""
========================================================================
 THIS IS THE FILE WHERE NETSHIELD AI CONNECTS TO MONGODB.
========================================================================

How to connect to your own MongoDB:

1. Local MongoDB:
   - Install MongoDB Community Server, run it, then in backend/.env set:
        MONGO_URI=mongodb://localhost:27017

2. MongoDB Atlas (cloud, free tier):
   - Create a free cluster at https://cloud.mongodb.com
   - Click "Connect" -> "Drivers" -> copy the connection string, e.g.:
        mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net
   - Put that string in backend/.env as MONGO_URI
   - Whitelist your IP (or 0.0.0.0/0 for testing) in Atlas Network Access.

Nothing below this needs to change for a normal setup — the connection
string always comes from the .env file via config.py.

For the (optional) PostgreSQL layer, see app/postgres_db.py — it is
independent of everything below and never blocks startup.
========================================================================
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

from app.config import settings

# --- The actual MongoDB connection lives here ---
client = AsyncIOMotorClient(settings.mongo_uri)
print("Mongo URI:", repr(settings.mongo_uri))
db = client[settings.mongo_db_name]

# Collections used across the app
users_collection = db["users"]
packets_collection = db["packets"]                    # simulated/aggregated traffic
alerts_collection = db["alerts"]                       # generated security alerts
predictions_collection = db["predictions"]              # AI prediction history
password_resets_collection = db["password_resets"]      # forgot-password tokens
app_settings_collection = db["app_settings"]             # settings page values (AI config, notifications, theme)
training_history_collection = db["training_history"]     # Feature 5: model training runs + metrics
dataset_uploads_collection = db["dataset_uploads"]        # Feature 5: uploaded dataset metadata
audit_logs_collection = db["audit_logs"]                  # security-relevant actions (login, training, model swap, etc.)


async def init_indexes():
    """Call once on startup to make sure required indexes exist."""
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True, sparse=True)
    await alerts_collection.create_index([("created_at", ASCENDING)])
    await predictions_collection.create_index([("created_at", ASCENDING)])
    await packets_collection.create_index([("timestamp", DESCENDING)])
    await password_resets_collection.create_index("expires_at", expireAfterSeconds=0)
    await training_history_collection.create_index([("created_at", DESCENDING)])
    await dataset_uploads_collection.create_index([("uploaded_at", DESCENDING)])
    await audit_logs_collection.create_index([("created_at", DESCENDING)])


async def log_audit(action: str, actor: str, details: dict | None = None) -> None:
    """Best-effort audit trail. Never raises — an audit log failure must not
    break the calling request."""
    try:
        from datetime import datetime

        await audit_logs_collection.insert_one({
            "action": action,
            "actor": actor,
            "details": details or {},
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


async def check_connection() -> bool:
    """Simple health check used by the /health endpoint."""
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False
