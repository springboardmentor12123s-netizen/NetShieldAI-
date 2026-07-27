"""
Packet Monitoring module.

No live capture (Wireshark/Zeek) is wired up yet, so this simulates
realistic packet/flow records on demand and stores them in MongoDB, with
search/filter/sort/pagination on top — the same shape a real capture
pipeline would produce, so swapping in real capture later only means
changing how rows get inserted into `packets_collection`.
"""
import random
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.database import packets_collection

router = APIRouter(prefix="/api/packets", tags=["packets"])

PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"]
STATUSES = ["normal", "suspicious", "blocked"]
RNG = random.Random()


def _random_ip() -> str:
    return ".".join(str(RNG.randint(1, 254)) for _ in range(4))


def _simulate_packet() -> dict:
    status = RNG.choices(STATUSES, weights=[80, 15, 5])[0]
    return {
        "packet_id": f"PKT-{uuid.uuid4().hex[:10].upper()}",
        "source_ip": _random_ip(),
        "destination_ip": _random_ip(),
        "protocol": RNG.choice(PROTOCOLS),
        "source_port": RNG.randint(1024, 65535),
        "destination_port": RNG.choice([80, 443, 22, 53, 3389, 8080, RNG.randint(1024, 65535)]),
        "packet_size": RNG.randint(64, 65535),
        "duration": round(RNG.uniform(0.01, 12.0), 3),
        "flow_rate": round(RNG.uniform(1, 5000), 2),
        "status": status,
        "source": "simulated",
        "timestamp": datetime.utcnow(),
    }


@router.post("/simulate")
async def simulate_packets(count: int = 25, current_user=Depends(get_current_user)):
    """Generates `count` simulated packets and stores them. Call this to
    populate the Packet Monitoring page with fresh traffic."""
    count = max(1, min(count, 500))
    docs = [_simulate_packet() for _ in range(count)]
    if docs:
        await packets_collection.insert_many(docs)
    return {"inserted": len(docs)}


@router.get("")
async def list_packets(
    search: str | None = Query(None, description="Matches source or destination IP"),
    protocol: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    source: str | None = Query(None, description="Filter by 'live' or 'simulated'"),
    sort_by: str = Query("timestamp", pattern="^(timestamp|packet_size|duration|flow_rate)$"),
    sort_dir: int = Query(-1, ge=-1, le=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    current_user=Depends(get_current_user),
):
    query: dict = {}
    if protocol:
        query["protocol"] = protocol
    if status_filter:
        query["status"] = status_filter
    if source:
        query["source"] = source
    if search:
        query["$or"] = [
            {"source_ip": {"$regex": search, "$options": "i"}},
            {"destination_ip": {"$regex": search, "$options": "i"}},
            {"packet_id": {"$regex": search, "$options": "i"}},
        ]

    total = await packets_collection.count_documents(query)
    if total == 0 and source is None:
        # Nothing simulated yet for a fresh install — seed a page so the UI isn't empty.
        await simulate_packets(count=50, current_user=current_user)
        total = await packets_collection.count_documents(query)

    cursor = (
        packets_collection.find(query)
        .sort(sort_by, sort_dir)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)

    return {"items": items, "total": total, "page": page, "page_size": page_size}
