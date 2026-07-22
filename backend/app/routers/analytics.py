from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db

router = APIRouter()


@router.get("/attack-types")
def attack_types(db: Session = Depends(get_db)):

    result = db.execute(text("""
        SELECT
            label,
            COUNT(*) AS total
        FROM network_traffic
        GROUP BY label
        ORDER BY total DESC
    """))

    return [
        {
            "label": row.label,
            "total": row.total
        }
        for row in result
    ]


@router.get("/protocol-distribution")
def protocol_distribution(db: Session = Depends(get_db)):

    result = db.execute(text("""
        SELECT
            protocol,
            COUNT(*) AS total
        FROM network_traffic
        GROUP BY protocol
        ORDER BY total DESC
    """))

    return [
        {
            "protocol": row.protocol,
            "total": row.total
        }
        for row in result
    ]


@router.get("/top-ports")
def top_ports(db: Session = Depends(get_db)):

    result = db.execute(text("""
        SELECT
            destination_port,
            COUNT(*) AS total
        FROM network_traffic
        GROUP BY destination_port
        ORDER BY total DESC
        LIMIT 10
    """))

    return [
        {
            "destination_port": row.destination_port,
            "total": row.total
        }
        for row in result
    ]
@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):

    total = db.execute(text("""
        SELECT COUNT(*) FROM network_traffic
    """)).scalar()

    benign = db.execute(text("""
        SELECT COUNT(*) FROM network_traffic
        WHERE label='BENIGN'
    """)).scalar()

    attack = total - benign

    top_attack = db.execute(text("""
        SELECT label, COUNT(*) AS total
        FROM network_traffic
        WHERE label != 'BENIGN'
        GROUP BY label
        ORDER BY total DESC
        LIMIT 1
    """)).first()

    return {
        "total_traffic": total,
        "benign_traffic": benign,
        "attack_traffic": attack,
        "top_attack": top_attack.label if top_attack else "None"
    }

@router.get("/traffic-trend")
def traffic_trend(db: Session = Depends(get_db)):

    result = db.execute(text("""
        SELECT
            label,
            COUNT(*) AS total
        FROM network_traffic
        GROUP BY label
        ORDER BY total DESC
    """))

    return [
        {
            "name": row.label,
            "traffic": row.total
        }
        for row in result
    ]