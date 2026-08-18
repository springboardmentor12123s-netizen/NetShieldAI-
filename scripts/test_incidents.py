import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.future import select
from app.core.database import async_session_factory
from app.models.incident import Incident

async def test():
    async with async_session_factory() as session:
        res = await session.execute(select(Incident))
        incidents = res.scalars().all()
        print("Total incidents in PostgreSQL database:", len(incidents))
        for inc in incidents:
            print(f"Incident: {inc.id} | {inc.title} | {inc.status} | {inc.severity}")

if __name__ == "__main__":
    asyncio.run(test())
