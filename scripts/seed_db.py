"""NetShield AI - Database Seeder Script for Development Environments."""

import asyncio
import os
import random
import sys
from datetime import datetime, timezone, timedelta

# Append backend and scripts to py path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.future import select
from app.core.mongodb import MongoDBManager
from app.core.database import async_session_factory
from app.models.role import Role
from app.models.user import User
from app.models.team import Team, TeamMember
from app.core.security import hash_password
from app.repositories.traffic_repository import TrafficRepository

# Check if create_admin function can be run first
from create_admin import seed_roles_and_admin


async def seed_teams_and_analysts():
    """Seed sample operations teams and analyst user accounts."""
    async with async_session_factory() as session:
        # Retrieve Roles
        res_admin = await session.execute(select(Role).where(Role.name == "Admin"))
        admin_role = res_admin.scalar_one()

        res_analyst = await session.execute(select(Role).where(Role.name == "Analyst"))
        analyst_role = res_analyst.scalar_one()

        # Seed Teams
        teams_data = [
            ("Blue Team", "SOC Operations", "Defense operations and monitoring"),
            ("Red Team", "Penetration Testing", "Offensive security research"),
            ("Threat Intel Team", "Target Analysis", "Analyzing threat intelligence feeds"),
        ]

        db_teams = {}
        for name, dept, desc in teams_data:
            stmt = select(Team).where(Team.name == name)
            res = await session.execute(stmt)
            team = res.scalar_one_or_none()
            if not team:
                team = Team(name=name, department=dept, description=desc, is_active=True)
                session.add(team)
                await session.flush()
            db_teams[name] = team

        # Seed Analysts
        analysts_data = [
            ("analyst1@netshield.io", "Alice Smith", "Blue Team", "Lead Defender"),
            ("analyst2@netshield.io", "Bob Johnson", "Red Team", "Offensive Operator"),
            ("analyst3@netshield.io", "Charlie Davis", "Threat Intel Team", "Intel Researcher"),
        ]

        for email, name, team_name, role_in_team in analysts_data:
            stmt = select(User).where(User.email == email)
            res = await session.execute(stmt)
            user = res.scalar_one_or_none()
            team = db_teams[team_name]

            if not user:
                user = User(
                    email=email,
                    full_name=name,
                    hashed_password=hash_password("AnalystPassword123!"),
                    role_id=analyst_role.id,
                    team_id=team.id,
                    is_active=True,
                    is_locked=False,
                )
                session.add(user)
                await session.flush()

                # Register in TeamMember table
                stmt_member = select(TeamMember).where(
                    (TeamMember.team_id == team.id) & (TeamMember.user_id == user.id)
                )
                res_member = await session.execute(stmt_member)
                if not res_member.scalar_one_or_none():
                    tm = TeamMember(team_id=team.id, user_id=user.id, role_in_team=role_in_team)
                    session.add(tm)

                print(f"OK: Created analyst account: {email} / AnalystPassword123! in {team_name}")

        await session.commit()
        print("OK: Sample teams and analysts seeded successfully.")


async def seed_traffic_logs(count: int = 150):
    """Seed MongoDB collection with realistic network traffic data logs."""
    await MongoDBManager.connect()
    try:
        db = MongoDBManager.get_database()
        # Seed indexes
        await db["traffic_logs"].create_index([("timestamp", -1)])
        await db["traffic_logs"].create_index([("src_ip", 1)])
        await db["traffic_logs"].create_index([("dst_ip", 1)])
        await db["traffic_logs"].create_index([("protocol", 1)])

        repo = TrafficRepository(db)

        # Realistic assets IPs
        internal_ips = [f"192.168.1.{i}" for i in range(10, 50)] + [f"10.0.0.{i}" for i in range(5, 25)]
        external_ips = [
            "8.8.8.8", "8.8.4.4", "1.1.1.1", "142.250.190.46",
            "157.240.22.35", "185.199.108.153", "34.120.177.193",
            "203.0.113.88", "198.51.100.41", "45.33.32.156",
        ]
        protocols = ["TCP", "UDP", "ICMP"]
        countries = ["US", "DE", "CN", "GB", "NL", "JP", "RU", "FR", "CA", "IN"]

        logs = []
        now = datetime.now(timezone.utc)

        for i in range(count):
            # 85% normal traffic, 15% random external scans
            is_internal = random.random() < 0.75
            src = random.choice(internal_ips) if is_internal else random.choice(external_ips)
            dst = random.choice(internal_ips) if not is_internal else random.choice(external_ips)

            if src == dst:
                dst = "8.8.8.8"

            proto = random.choice(protocols)
            if proto == "ICMP":
                src_port = 0
                dst_port = 0
            else:
                src_port = random.choice([80, 443, 22, 53, 8080, 3000] + list(range(49152, 65535)))
                dst_port = random.choice([80, 443, 22, 53, 8080, 3000] + list(range(49152, 65535)))

            # Timing spread over the last 24 hours
            time_offset = random.randint(0, 86400)
            log_time = now - timedelta(seconds=time_offset)

            # Sizes
            sent = random.randint(40, 1500) if proto == "ICMP" else random.randint(100, 1000000)
            recv = random.randint(40, 1500) if proto == "ICMP" else random.randint(100, 2000000)
            packets = random.randint(1, 10) if proto == "ICMP" else random.randint(5, 500)

            log_entry = {
                "timestamp": log_time,
                "src_ip": src,
                "dst_ip": dst,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": proto,
                "bytes_sent": sent,
                "bytes_received": recv,
                "packet_count": packets,
                "flags": ["SYN", "ACK"] if proto == "TCP" and random.random() > 0.5 else [],
                "duration_ms": random.randint(1, 4000),
                "geo": {
                    "src_country": "US" if src.startswith("19") or src.startswith("10") else random.choice(countries),
                    "dst_country": "US" if dst.startswith("19") or dst.startswith("10") else random.choice(countries),
                },
                "metadata": {
                    "sensor_id": f"IDS-SENSOR-{random.randint(1, 3)}",
                    "interface": "eth0",
                },
            }
            logs.append(log_entry)

        # Batch insert
        inserted = await repo.insert_batch(logs)
        print(f"OK: Seeded {inserted} traffic logs in MongoDB.")
    finally:
        await MongoDBManager.disconnect()


async def seed_alerts_feed(count: int = 25):
    """Seed MongoDB alerts collection with realistic security alert details."""
    await MongoDBManager.connect()
    try:
        db = MongoDBManager.get_database()
        
        # Drop alerts collection if it exists to cleanly seed
        await db["alerts"].drop()
        await db["alerts"].create_index([("timestamp", -1)])
        await db["alerts"].create_index([("severity", 1)])
        
        import uuid
        
        # Sample alert templates
        alert_templates = [
            {
                "severity": "critical",
                "alert_type": "DDoS Activity",
                "source_ip": "185.120.45.62",
                "dest_ip": "192.168.1.15",
                "description": "High volume packet flood / Port Scan rate anomaly detected on internal subnet gateway."
            },
            {
                "severity": "high",
                "alert_type": "Authentication Anomalies",
                "source_ip": "91.240.118.5",
                "dest_ip": "192.168.1.10",
                "description": "Multiple persistent SSH authentication failures from unverified external node."
            },
            {
                "severity": "medium",
                "alert_type": "Database Scanning",
                "source_ip": "10.0.0.145",
                "dest_ip": "192.168.1.20",
                "description": "External port swept request rejected by database monitoring credentials rule."
            },
            {
                "severity": "low",
                "alert_type": "Hardware Alert",
                "source_ip": "127.0.0.1",
                "dest_ip": "127.0.0.1",
                "description": "Process monitoring logs warn that processor server temp exceeds threshold."
            }
        ]
        
        alerts = []
        now = datetime.now(timezone.utc)
        for i in range(count):
            tpl = random.choice(alert_templates)
            time_offset = random.randint(0, 10800)  # spread over past 3 hours
            alert_time = now - timedelta(seconds=time_offset)
            
            alert_doc = {
                "_id": str(uuid.uuid4()),
                "severity": tpl["severity"],
                "alert_type": tpl["alert_type"],
                "source_ip": tpl["source_ip"],
                "dest_ip": tpl["dest_ip"],
                "description": tpl["description"],
                "timestamp": alert_time,
                "metadata": {
                    "injected": False,
                    "rule_id": f"RULE_SIG_{random.randint(100, 999)}"
                }
            }
            alerts.append(alert_doc)
            
        await db["alerts"].insert_many(alerts)
        print(f"OK: Seeded {len(alerts)} alerts in MongoDB (alerts collection).")
    finally:
        await MongoDBManager.disconnect()


async def main():
    print("Starting NetShield AI Database Seeder...")
    # 1. Base RBAC
    await seed_roles_and_admin()
    # 2. Teams and Analysts
    await seed_teams_and_analysts()
    # 3. MongoDB Traffic Logs
    await seed_traffic_logs(200)
    # 4. MongoDB Alerts Logs
    await seed_alerts_feed(25)
    print("Database seeding finished successfully.")


if __name__ == "__main__":
    asyncio.run(main())
