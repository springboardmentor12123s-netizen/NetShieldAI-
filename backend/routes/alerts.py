from fastapi import APIRouter

from data.alerts import alerts

router = APIRouter()


@router.get("/")

def get_alerts():

    return {

        "count": len(alerts),

        "alerts": alerts

    }