from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter

from app.database.database import get_db
from app.services.prediction_service import predict_live_traffic

router = APIRouter()


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):

    predictions = predict_live_traffic(db)

    total = len(predictions)

    benign = sum(
        1 for p in predictions
        if p["prediction"] == "BENIGN"
    )

    attacks = total - benign

    attack_counter = Counter(
        p["prediction"]
        for p in predictions
        if p["prediction"] != "BENIGN"
    )

    top_attack = (
        attack_counter.most_common(1)[0][0]
        if attack_counter
        else "None"
    )

    return {
        "total_traffic": total,
        "benign_traffic": benign,
        "attack_traffic": attacks,
        "top_attack": top_attack
    }


@router.get("/attack-types")
def attack_types(db: Session = Depends(get_db)):

    predictions = predict_live_traffic(db)

    counter = Counter(
        p["prediction"]
        for p in predictions
    )

    return [
        {
            "label": label,
            "total": total
        }
        for label, total in counter.items()
    ]


@router.get("/protocol-distribution")
def protocol_distribution(db: Session = Depends(get_db)):

    predictions = predict_live_traffic(db)

    counter = Counter(
        p["protocol"]
        for p in predictions
    )

    return [
        {
            "protocol": protocol,
            "total": total
        }
        for protocol, total in counter.items()
    ]
@router.get("/top-ports")
def top_ports(db: Session = Depends(get_db)):

    predictions = predict_live_traffic(db)

    counter = Counter()

    for packet in predictions:

        port = packet.get("destination_port")

        if port is not None:
            counter[port] += 1

    return [
        {
            "destination_port": port,
            "total": total
        }
        for port, total in counter.most_common(10)
    ]

@router.get("/traffic-trend")
def traffic_trend(db: Session = Depends(get_db)):

    predictions = predict_live_traffic(db)

    counter = Counter(
        p["prediction"]
        for p in predictions
    )

    return [
        {
            "name": label,
            "traffic": total
        }
        for label, total in counter.items()
    ]