from fastapi import APIRouter

from data.alerts import alerts
from data.incidents import incidents
from data.traffic_data import network_stats
from data.live_packets import protocol_counter, unique_ips

router = APIRouter()


@router.get("/")
def analytics():

    total_alerts = len(alerts)

    total_incidents = len(incidents)

    critical_alerts = len(
        [a for a in alerts if a["severity"] == "Critical"]
    )

    high = len(
        [a for a in alerts if a["severity"] == "High"]
    )

    medium = len(
        [a for a in alerts if a["severity"] == "Medium"]
    )

    low = len(
        [a for a in alerts if a["severity"] == "Low"]
    )

    if total_alerts:
        average_risk = round(
            sum(a["risk"] for a in alerts) / total_alerts,
            2
        )
    else:
        average_risk = 0

    return {

        "active_devices": len(unique_ips),

        "packets": network_stats["packets"],

        "upload_speed": network_stats["upload_speed"],

        "download_speed": network_stats["download_speed"],

        "bytes_sent": network_stats["bytes_sent"],

        "bytes_recv": network_stats["bytes_recv"],

        "interfaces_up": network_stats["interfaces_up"],

        "protocol_distribution": protocol_counter,

        "total_alerts": total_alerts,

        "total_incidents": total_incidents,

        "critical_alerts": critical_alerts,

        "high_alerts": high,

        "medium_alerts": medium,

        "low_alerts": low,

        "average_risk": average_risk

    }