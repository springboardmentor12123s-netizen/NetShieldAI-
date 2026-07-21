"""
One-time seed script: creates the DB schema (if missing) plus a default
admin account and a demo SOC team so the app is usable immediately.

Run from backend/:  python seed.py
"""
from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401
from app.models.user import User, Team, UserRole
from app.auth.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    if not db.query(Team).filter(Team.name == "SOC Alpha").first():
        team = Team(name="SOC Alpha", description="Primary security operations team")
        db.add(team)
        db.commit()
        db.refresh(team)
    else:
        team = db.query(Team).filter(Team.name == "SOC Alpha").first()

    if not db.query(User).filter(User.email == "admin@netshield.ai").first():
        admin = User(
            full_name="Alf Administrator",
            email="admin@netshield.ai",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            team_id=team.id,
        )
        db.add(admin)
        print("Created admin user -> email: admin@netshield.ai | password: Admin@123")
    else:
        print("Admin user already exists, skipping.")

    if not db.query(User).filter(User.email == "analyst@netshield.ai").first():
        analyst = User(
            full_name="Nina Analyst",
            email="analyst@netshield.ai",
            hashed_password=hash_password("Analyst@123"),
            role=UserRole.ANALYST,
            team_id=team.id,
        )
        db.add(analyst)
        print("Created analyst user -> email: analyst@netshield.ai | password: Analyst@123")

    db.commit()
    print("Seed complete.")
finally:
    db.close()
