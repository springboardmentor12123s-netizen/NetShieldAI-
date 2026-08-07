import uuid
import logging

from app.database import SessionLocal
from app.models.records import Incident

logger = logging.getLogger("netshield.incident_service")


class IncidentService:
    def _map_severity_to_priority(self, severity: str) -> str:
        mapping = {
            "Critical": "Critical",
            "High": "High",
            "Medium": "Medium",
            "Low": "Low"
        }
        return mapping.get(severity, "Medium")

    def create_incident_from_prediction(self, prediction_result: dict):
        """
        Creates an incident based on an attack prediction.
        """
        try:
            # prediction_result format from live_predictor:
            # { "flow_id": ..., "prediction_timestamp": ..., "predicted_class": ...,
            #   "confidence": ..., "risk_score": ..., "severity": ..., "prediction_label": ... }

            db = SessionLocal()
            try:
                incident = Incident(
                    id=str(uuid.uuid4()),
                    # If prediction_timestamp is ISO string, parse it.
                    # Incident model uses default=utc_now, but it's good to match the prediction time.
                    # We'll just let the DB set the timestamp to utc_now.
                    flow_id=prediction_result.get("flow_id", "Unknown"),
                    threat_category=prediction_result.get("predicted_class", "Unknown"),
                    prediction=prediction_result.get("prediction_label", "Anomaly"),
                    severity=prediction_result.get("severity", "Medium"),
                    risk_score=prediction_result.get("risk_score", 0),
                    status="Open",
                    priority=self._map_severity_to_priority(prediction_result.get("severity", "Medium")),
                )
                db.add(incident)
                db.commit()
                logger.info(f"Created Incident {incident.id} for flow {incident.flow_id}")
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to create incident in DB: {e}")
            finally:
                db.close()
        except Exception as ex:
            logger.error(f"Error in create_incident_from_prediction: {ex}")


incident_service = IncidentService()
