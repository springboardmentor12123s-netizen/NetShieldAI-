import os
from pymongo import MongoClient

# Get the Mongo URL from environment variables (for Docker), 
# or fallback to local 127.0.0.1 if running natively
MONGO_URI = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017/")

# Create the client
mongo_client = MongoClient(MONGO_URI)

# Create/Access the database named "netshield_traffic"
db = mongo_client["netshield_traffic"]

# Create/Access the collection named "network_flows"
flows_collection = db["network_flows"]