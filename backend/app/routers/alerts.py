from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db

router = APIRouter()


@router.get("/")
def get_alerts(
    search: str = "",
    severity: str = "",
    page: int = Query(default=1, ge=1),
    db: Session = Depends(get_db),
):
    limit = 20
    offset = (page - 1) * limit

    conditions = ["label != 'BENIGN'"]

    params = {
        "limit": limit,
        "offset": offset,
    }

    if search:
        conditions.append("""
        (
            CAST(destination_port AS TEXT) ILIKE :search
            OR protocol ILIKE :search
            OR label ILIKE :search
        )
        """)
        params["search"] = f"%{search}%"

    if severity:
        conditions.append("""
            CASE
    WHEN label ILIKE '%DDoS%' THEN 'Critical'
    WHEN label ILIKE '%DoS%' THEN 'High'
    WHEN label ILIKE '%PortScan%' THEN 'Medium'
    ELSE 'High'
END
            END = :severity
        """)
        params["severity"] = severity

    where_clause = " AND ".join(conditions)

    result = db.execute(
        text(f"""
            SELECT
                id,
                destination_port,
                protocol,
                label,

                CASE
                    WHEN label = 'BENIGN' THEN 'Low'
                    WHEN label ILIKE '%PortScan%' THEN 'Medium'
                    WHEN label ILIKE '%DoS%' THEN 'High'
                    WHEN label ILIKE '%DDoS%' THEN 'Critical'
                    ELSE 'High'
                END AS severity

            FROM network_traffic

            WHERE {where_clause}

            ORDER BY id DESC

            LIMIT :limit OFFSET :offset
        """),
        params,
    )

    return [
        {
            "id": row.id,
            "destination_port": row.destination_port,
            "protocol": row.protocol,
            "label": row.label,
            "severity": row.severity,
        }
        for row in result
    ]