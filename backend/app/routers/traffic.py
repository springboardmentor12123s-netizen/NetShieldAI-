from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db
from app.services.packet_capture import get_live_packets
from app.services.flow_builder import get_flows
from app.services.prediction_service import predict_live_traffic
router = APIRouter()

@router.get("/")
def get_traffic(
    search: str = Query(default=""),
    label: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    sort_by: str = Query(default="id"),
    sort_order: str = Query(default="asc"),
    db: Session = Depends(get_db),
):

    limit = 20
    offset = (page - 1) * limit

    conditions = []
    params = {
        "limit": limit,
        "offset": offset,
    }

    allowed_columns = {
        "id",
        "destination_port",
        "flow_duration",
        "label",
        "protocol",
    }

    if sort_by not in allowed_columns:
        sort_by = "id"

    sort_order = "DESC" if sort_order.lower() == "desc" else "ASC"

    if search:
        conditions.append("""
        (
            CAST(destination_port AS TEXT) ILIKE :search
            OR protocol ILIKE :search
            OR label ILIKE :search
        )
        """)
        params["search"] = f"%{search}%"

    if label:
        conditions.append("label = :label")
        params["label"] = label

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = text(f"""
        SELECT
            id,
            destination_port,
            protocol,
            flow_duration,
            label
        FROM network_traffic
        {where_clause}
        ORDER BY {sort_by} {sort_order}
        LIMIT :limit OFFSET :offset
    """)

    result = db.execute(query, params)

    traffic = []

    for row in result:
        traffic.append({
            "id": row.id,
            "destination_port": row.destination_port,
            "protocol": row.protocol,
            "flow_duration": row.flow_duration,
            "label": row.label,
        })

    return traffic


@router.get("/labels")
def get_labels(db: Session = Depends(get_db)):

    result = db.execute(
        text("""
            SELECT DISTINCT label
            FROM network_traffic
            ORDER BY label
        """)
    )

    labels = [row.label for row in result]

    return labels


@router.get("/live")
def get_live_traffic():
    """
    Returns the latest captured live packets.
    """
    return get_live_packets()

@router.get("/flows")
def get_live_flows():
    """
    Returns calculated live network flows.
    """
    return get_flows()

@router.get("/predictions")
def get_predictions(
    db: Session = Depends(get_db)
):
   
    return predict_live_traffic(db)