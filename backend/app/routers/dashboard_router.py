from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db

router = APIRouter()


@router.get("/summary")

def dashboard_summary(db: Session = Depends(get_db)):

    total = db.execute(
        text("SELECT COUNT(*) FROM network_traffic")
    ).scalar()

    benign = db.execute(
        text(
            "SELECT COUNT(*) FROM network_traffic WHERE label='BENIGN'"
        )
    ).scalar()

    attack = total - benign

    attack_percentage = (
        (attack / total) * 100
        if total > 0
        else 0
    )

    return {
        "total_traffic": total,
        "benign_traffic": benign,
        "attack_traffic": attack,
        "attack_percentage": round(attack_percentage, 2),
    }

@router.get("/traffic")
def get_recent_traffic(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT
                id,
                destination_port,
                protocol,
                flow_duration,
                label
            FROM network_traffic
            ORDER BY id DESC
            LIMIT 20
        """)
    )

    rows = result.mappings().all()

    return rows