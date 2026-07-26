from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.config import get_settings
from app.database import init_postgres, init_mongo_indexes, engine, AsyncSessionLocal
from app.models.user import Role, User
from app.auth.security import get_password_hash
from app.api import auth, users, traffic, ingestion, ml

settings = get_settings()

async def seed_roles_and_admin():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Role))
        if not res.scalars().all():
            db.add_all([Role(name="admin", permissions="all"), Role(name="analyst", permissions="read,analyze"), Role(name="viewer", permissions="read")])
            await db.commit()
        admin_role = (await db.execute(select(Role).where(Role.name == "admin"))).scalar_one_or_none()
        if admin_role:
            existing = (await db.execute(select(User).where(User.username == "admin"))).scalar_one_or_none()
            if not existing:
                db.add(User(username="admin", email="admin@netshield.ai", hashed_password=get_password_hash("admin"), role_id=admin_role.id, is_superuser=True))
                await db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_postgres()
    await init_mongo_indexes()
    await seed_roles_and_admin()
    yield
    await engine.dispose()

app = FastAPI(title="NetShield AI", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(traffic.router, prefix="/api/v1")
app.include_router(ingestion.router, prefix="/api/v1")
app.include_router(ml.router, prefix="/api/v1")

@app.get("/health")
async def health(): return {"status": "ok"}
