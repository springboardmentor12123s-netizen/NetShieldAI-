from fastapi import APIRouter
from data.threat_stats import attack_stats

router = APIRouter()

@router.get("/")
def stats():
    return attack_stats