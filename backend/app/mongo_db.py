from pymongo import MongoClient

# Connect to the MongoDB Docker container (default local port 27017)
MONGO_URI = "mongodb://localhost:27017/"

# Create the client
mongo_client = MongoClient(MONGO_URI)

# Create/Access the database named "netshield_traffic"
db = mongo_client["netshield_traffic"]

# Create/Access the collection named "network_flows"
flows_collection = db["network_flows"]