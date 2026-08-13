from fastapi import APIRouter

from data.threat_timeline import timeline

router = APIRouter()


@router.get("/")
def get_timeline():
    return timeline