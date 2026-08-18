"""NetShield AI - Create Roles and Default Admin CLI Script."""

import asyncio
import os
import sys

# Append backend to py path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.future import select

from app.core.database import async_session_factory, Base, engine
from app.models.role import Role
from app.models.permission import Permission, RolePermission
from app.models.user import User
from app.core.security import hash_password


async def seed_roles_and_admin():
    """Seed system roles, permission resource actions, and create the root admin account."""
    # Ensure tables exist
    from app.core.database import init_db
    from app.models import User, Role, Permission, RolePermission  # noqa: F401 - ensure all models registered
    await init_db()

    async with async_session_factory() as session:
        # 1. Seed Permissions
        permissions_data = [
            ("users:read", "users", "read", "View users list and profiles"),
            ("users:write", "users", "write", "Create, edit, or delete users"),
            ("roles:read", "roles", "read", "View roles and permissions details"),
            ("roles:write", "roles", "write", "Modify role-permission parameters"),
            ("teams:read", "teams", "read", "View teams configurations and member lists"),
            ("teams:write", "teams", "write", "Create, update teams or edit member maps"),
            ("traffic:read", "traffic", "read", "Read high-volume network telemetry metadata"),
            ("traffic:write", "traffic", "write", "Ingest external/internal packet data streams"),
            ("audit:read", "audit", "read", "Inspect historical security incident action logs"),
            ("dashboard:read", "dashboard", "read", "Access security operations center metrics"),
            ("system:read", "system", "read", "View background queue performance indicators"),
        ]

        db_permissions = {}
        for name, resource, action, desc in permissions_data:
            stmt = select(Permission).where(Permission.name == name)
            res = await session.execute(stmt)
            perm = res.scalar_one_or_none()
            if not perm:
                perm = Permission(name=name, resource=resource, action=action, description=desc)
                session.add(perm)
                await session.flush()
            db_permissions[name] = perm

        # 2. Seed Roles
        # Administrator
        stmt = select(Role).where(Role.name == "Admin")
        res = await session.execute(stmt)
        admin_role = res.scalar_one_or_none()
        if not admin_role:
            admin_role = Role(name="Admin", description="Root System Administrator", is_system_role=True)
            session.add(admin_role)
            await session.flush()

        # Analyst
        stmt = select(Role).where(Role.name == "Analyst")
        res = await session.execute(stmt)
        analyst_role = res.scalar_one_or_none()
        if not analyst_role:
            analyst_role = Role(name="Analyst", description="Security Operations Center Analyst", is_system_role=True)
            session.add(analyst_role)
            await session.flush()

        # 3. Grant Permissions to Admin (All)
        for perm in db_permissions.values():
            stmt = select(RolePermission).where(
                (RolePermission.role_id == admin_role.id) &
                (RolePermission.permission_id == perm.id)
            )
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                rp = RolePermission(role_id=admin_role.id, permission_id=perm.id)
                session.add(rp)

        # 4. Grant Permissions to Analyst (Telemetry and Dashboard)
        analyst_permissions = [
            "traffic:read",
            "traffic:write",
            "dashboard:read",
            "teams:read",
            "system:read",
        ]
        for name in analyst_permissions:
            perm = db_permissions[name]
            stmt = select(RolePermission).where(
                (RolePermission.role_id == analyst_role.id) &
                (RolePermission.permission_id == perm.id)
            )
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                rp = RolePermission(role_id=analyst_role.id, permission_id=perm.id)
                session.add(rp)

        # 5. Create Root Admin User
        import os
        admin_email = os.getenv("ADMIN_EMAIL", "admin@netshield.io")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")
        
        stmt = select(User).where(User.email == admin_email)
        res = await session.execute(stmt)
        admin_user = res.scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                full_name="NetShield Administrator",
                hashed_password=hash_password(admin_password),
                role_id=admin_role.id,
                is_active=True,
                is_locked=False,
                is_deleted=False,
            )
            session.add(admin_user)
            print(f"OK: Root administrator account created: {admin_email}")
        else:
            print("INFO: Administrator account already exists.")

        await session.commit()
        print("OK: RBAC roles and permissions seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed_roles_and_admin())
