import random
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth_utils import get_current_user
from .. import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# In a full implementation, these numbers would come from real packet capture
# (Wireshark/Zeek logs) and your trained anomaly detection models. For now this
# generates realistic-looking mock data so the dashboard UI has something to show.
PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "ICMP"]
ATTACK_TYPES = ["Benign", "DDoS", "PortScan", "Bot", "Brute Force", "Web Attack", "Infiltration"]


@router.get("/stats")
def get_dashboard_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_packets = random.randint(50000, 200000)
    total_alerts = random.randint(20, 150)

    protocol_breakdown = [
        {"protocol": p, "count": random.randint(500, 20000)} for p in PROTOCOLS
    ]

    attack_breakdown = [
        {"type": a, "count": random.randint(0, 500)} for a in ATTACK_TYPES
    ]

    recent_alerts = [
        {
            "id": i,
            "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=i * 7)).strftime("%Y-%m-%d %H:%M"),
            "type": random.choice(ATTACK_TYPES[1:]),
            "source_ip": f"192.168.{random.randint(0,255)}.{random.randint(0,255)}",
            "severity": random.choice(["Low", "Medium", "High", "Critical"]),
        }
        for i in range(1, 8)
    ]

    return {
        "total_packets": total_packets,
        "total_alerts": total_alerts,
        "active_users": db.query(models.User).filter(models.User.is_active == True).count(),
        "protocol_breakdown": protocol_breakdown,
        "attack_breakdown": attack_breakdown,
        "recent_alerts": recent_alerts,
        "model_accuracy": {
            "random_forest": 68.25,
            "xgboost": 70.27,
        },
    }
