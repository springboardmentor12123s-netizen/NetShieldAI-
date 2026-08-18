import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.mongodb import MongoDBManager
from app.repositories.traffic_repository import TrafficRepository

async def test():
    await MongoDBManager.connect()
    db = MongoDBManager.get_database()
    repo = TrafficRepository(db)
    
    # Check total logs
    total = await repo.get_total_count()
    print(f"Total traffic log documents: {total}")
    
    # Check analytics
    analytics = await repo.get_analytics(24)
    print("Bandwidth usage size:", len(analytics["bandwidth_usage"]))
    if analytics["bandwidth_usage"]:
        print("Bandwidth usage sample:", analytics["bandwidth_usage"])
    print("Protocol distribution:", analytics["protocol_distribution"])
    
    await MongoDBManager.disconnect()

if __name__ == "__main__":
    asyncio.run(test())
