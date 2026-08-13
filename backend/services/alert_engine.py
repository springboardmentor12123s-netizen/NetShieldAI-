from datetime import datetime
import uuid

from data.alerts import alerts
from services.incident_engine import IncidentEngine


class AlertEngine:

    @staticmethod
    def create_alert(
        attack,
        confidence,
        risk,
        severity,
        recommendation,
        source_ip="Unknown",
        destination_ip="Unknown"
    ):

        alert = {

            "id": str(uuid.uuid4())[:8],

            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),

            "attack": attack,

            "confidence": round(confidence,2),

            "risk": round(risk,2),

            "severity": severity,

            "recommendation": recommendation,

            "source_ip": source_ip,

            "destination_ip": destination_ip,

            "status":"Open",

            "created_by": "AI Engine",
            
            "acknowledged": False,

        }

        alerts.append(alert)

        # Automatically create an incident
        IncidentEngine.create_incident(alert)

        return alert