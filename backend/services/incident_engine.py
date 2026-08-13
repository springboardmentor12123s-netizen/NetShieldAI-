from datetime import datetime
import uuid

from data.incidents import incidents


class IncidentEngine:

    @staticmethod
    def create_incident(alert):

        incident = {

            "id": str(uuid.uuid4())[:8],

            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),

            "attack": alert["attack"],

            "severity": alert["severity"],

            "risk": alert["risk"],

            "recommendation": alert["recommendation"],

            "status": "Open",

            "assigned_to": "Unassigned",

            "priority": alert["severity"],

            "opened_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),

            "closed_at": None,

        }

        incidents.append(incident)

        return incident