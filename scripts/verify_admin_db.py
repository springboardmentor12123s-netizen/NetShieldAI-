import asyncio
from app.core.database import async_session_factory
from app.models.user import User
from sqlalchemy import select

async def main():
    print("Verifying database administrator record...")
    async with async_session_factory() as session:
        res = await session.execute(select(User).where(User.email == 'admin@netshield.io'))
        u = res.scalar_one_or_none()
        if u:
            print("[SUCCESS] Administrator found in database:")
            print(f"  Email: {u.email}")
            print(f"  Is Active: {u.is_active}")
            print(f"  Is Locked: {u.is_locked}")
            print(f"  Is Deleted: {u.is_deleted}")
            print(f"  Password Hash exists: {bool(u.hashed_password)}")
        else:
            print("[FAILURE] Administrator admin@netshield.io not found in database!")

if __name__ == "__main__":
    asyncio.run(main())
