from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db
from app.services.dataset_service import dataset_summary

router = APIRouter()

@router.get("/summary")
def get_summary():
    return dataset_summary()

@router.get("/attack-distribution")
def attack_distribution(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT label, COUNT(*) AS count
            FROM network_traffic
            GROUP BY label
            ORDER BY count DESC
        """)
    )

    data = []

    for row in result:
        data.append({
            "label": row[0],
            "count": row[1]
        })

    return data