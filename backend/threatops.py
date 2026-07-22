
from __future__ import annotations
 
import enum
import json
import logging
import os
import smtplib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Optional
 
import numpy as np
 
try:
    import joblib
except ImportError:  # pragma: no cover
    joblib = None
 
# Optional MongoDB persistence
try:
    from database import get_mongo_db
except Exception:
    get_mongo_db = lambda: None
 
logger = logging.getLogger("netshield.threat_ops")
logging.basicConfig(level=logging.INFO)
 
# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------
 
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model_artifacts"
ANOMALY_MODEL_PATH = MODEL_DIR / "anomaly_classifier.joblib"
RISK_MODEL_PATH = MODEL_DIR / "risk_regressor.joblib"
 
SLACK_WEBHOOK_URL = os.getenv("NETSHIELD_SLACK_WEBHOOK", "")
ALERT_EMAIL_FROM = os.getenv("NETSHIELD_ALERT_EMAIL_FROM", "alerts@netshield.local")
ALERT_EMAIL_TO = os.getenv("NETSHIELD_ALERT_EMAIL_TO", "")
SMTP_HOST = os.getenv("NETSHIELD_SMTP_HOST", "")
SMTP_PORT = int(os.getenv("NETSHIELD_SMTP_PORT", "587"))
SMTP_USER = os.getenv("NETSHIELD_SMTP_USER", "")
SMTP_PASS = os.getenv("NETSHIELD_SMTP_PASS", "")
 
 
# --------------------------------------------------------------------------
# Enums
# --------------------------------------------------------------------------
 
class ThreatLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
 
 
class AttackType(str, enum.Enum):
    """Attack categories — aligned with CICIDS2017 / UNSW-NB15 label sets."""
    BENIGN = "benign"
    DOS = "dos"
    DDOS = "ddos"
    PORT_SCAN = "port_scan"
    BRUTE_FORCE = "brute_force"
    BOTNET = "botnet"
    WEB_ATTACK = "web_attack"
    INFILTRATION = "infiltration"
    EXPLOIT = "exploit"
    RECONNAISSANCE = "reconnaissance"
    UNKNOWN_ANOMALY = "unknown_anomaly"
 
 
class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"
 
 
# --------------------------------------------------------------------------
# MODELS (adjust if needed) — lightweight in-memory/dataclass fallback
# --------------------------------------------------------------------------
# If you already have SQLAlchemy models in `models.py`, delete this block and
# do: `from models import Alert, Incident` instead, then adapt
# `save_alert()` / `save_incident()` to use your Session-based CRUD.
 
@dataclass
class Alert:
    id: Optional[int]
    source_ip: str
    destination_ip: str
    destination_port: Optional[int]
    protocol: Optional[str]
    attack_type: AttackType
    confidence: float
    risk_score: int
    severity: ThreatLevel
    detected_at: datetime
    raw_features: dict = field(default_factory=dict)
    incident_id: Optional[int] = None
    acknowledged: bool = False
 
    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        d["attack_type"] = self.attack_type.value
        d["severity"] = self.severity.value
        d["detected_at"] = self.detected_at.isoformat()
        return d
 
 
@dataclass
class Incident:
    id: Optional[int]
    title: str
    status: IncidentStatus
    severity: ThreatLevel
    alert_ids: list[int] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    assigned_to: Optional[str] = None
    notes: list[str] = field(default_factory=list)
 
    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        d["status"] = self.status.value
        d["severity"] = self.severity.value
        d["created_at"] = self.created_at.isoformat()
        d["updated_at"] = self.updated_at.isoformat()
        return d
 
 
# --------------------------------------------------------------------------
# In-memory store (swap for real DB session calls — see save_alert/save_incident)
# --------------------------------------------------------------------------
 
_ALERTS: dict[int, Alert] = {}
_INCIDENTS: dict[int, Incident] = {}
_alert_seq = 0
_incident_seq = 0
 
 
def _next_alert_id() -> int:
    global _alert_seq
    _alert_seq += 1
    return _alert_seq
 
 
def _next_incident_id() -> int:
    global _incident_seq
    _incident_seq += 1
    return _incident_seq
 
 
# --------------------------------------------------------------------------
# Model loading (lazy, cached)
# --------------------------------------------------------------------------
 
_anomaly_model = None
_risk_model = None
_model_load_attempted = False
 
 
def _load_models() -> None:
    """Lazily load trained classifier(s) produced by train_model.py /
    train_full_model.py. Falls back gracefully to rule-based scoring if
    artifacts aren't present yet (e.g. before Milestone 2 training runs)."""
    global _anomaly_model, _risk_model, _model_load_attempted
    if _model_load_attempted:
        return
    _model_load_attempted = True
 
    if joblib is None:
        logger.warning("joblib not installed — skipping model load, using rule-based fallback.")
        return
 
    if ANOMALY_MODEL_PATH.exists():
        try:
            _anomaly_model = joblib.load(ANOMALY_MODEL_PATH)
            logger.info("Loaded anomaly classifier from %s", ANOMALY_MODEL_PATH)
        except Exception as exc:
            logger.error("Failed to load anomaly classifier: %s", exc)
    else:
        logger.warning("No anomaly classifier found at %s — using rule-based fallback.", ANOMALY_MODEL_PATH)
 
    if RISK_MODEL_PATH.exists():
        try:
            _risk_model = joblib.load(RISK_MODEL_PATH)
            logger.info("Loaded risk regressor from %s", RISK_MODEL_PATH)
        except Exception as exc:
            logger.error("Failed to load risk regressor: %s", exc)
 
 
# --------------------------------------------------------------------------
# 1. ATTACK CLASSIFICATION
# --------------------------------------------------------------------------
 
def classify_attack(features: dict[str, Any]) -> tuple[AttackType, float]:
    """
    Classify a flow/packet feature vector into an AttackType with a
    confidence score (0.0-1.0).
 
    `features` should already be preprocessed by `pipeline/preprocess.py`
    into the same feature schema used at training time.
 
    Falls back to a simple heuristic if no trained model is available yet,
    so the rest of the pipeline (alerting, dashboards) can be developed and
    demoed before the ML model is finalized.
    """
    _load_models()
 
    if _anomaly_model is not None:
        try:
            feature_vector = _vectorize(features)
            pred = _anomaly_model.predict([feature_vector])[0]
            proba = None
            if hasattr(_anomaly_model, "predict_proba"):
                proba_row = _anomaly_model.predict_proba([feature_vector])[0]
                proba = float(np.max(proba_row))
            attack_type = _label_to_attack_type(pred)
            confidence = proba if proba is not None else 0.75
            return attack_type, round(confidence, 4)
        except Exception as exc:
            logger.error("Model inference failed, falling back to heuristic: %s", exc)
 
    return _heuristic_classify(features)
 
 
def _vectorize(features: dict[str, Any]) -> list[float]:
    """Convert a feature dict into the ordered numeric vector the model
    expects. Replace FEATURE_ORDER with the exact column order used in
    train_model.py."""
    FEATURE_ORDER = [
        "flow_duration", "total_fwd_packets", "total_bwd_packets",
        "flow_bytes_per_sec", "flow_packets_per_sec", "fwd_packet_len_mean",
        "bwd_packet_len_mean", "syn_flag_count", "ack_flag_count",
        "packet_size_avg",
    ]
    return [float(features.get(f, 0.0)) for f in FEATURE_ORDER]
 
 
def _label_to_attack_type(label: Any) -> AttackType:
    mapping = {
        "BENIGN": AttackType.BENIGN,
        "DoS": AttackType.DOS,
        "DDoS": AttackType.DDOS,
        "PortScan": AttackType.PORT_SCAN,
        "FTP-Patator": AttackType.BRUTE_FORCE,
        "SSH-Patator": AttackType.BRUTE_FORCE,
        "Bot": AttackType.BOTNET,
        "Web Attack": AttackType.WEB_ATTACK,
        "Infiltration": AttackType.INFILTRATION,
        "Exploits": AttackType.EXPLOIT,
        "Reconnaissance": AttackType.RECONNAISSANCE,
    }
    return mapping.get(str(label), AttackType.UNKNOWN_ANOMALY)
 
 
def _heuristic_classify(features: dict[str, Any]) -> tuple[AttackType, float]:
    """Rule-based fallback used only when no trained model artifact exists."""
    syn_count = features.get("syn_flag_count", 0)
    pkt_rate = features.get("flow_packets_per_sec", 0)
    fwd_pkts = features.get("total_fwd_packets", 0)
 
    if pkt_rate > 1000 and fwd_pkts > 500:
        return AttackType.DDOS, 0.55
    if syn_count > 50:
        return AttackType.PORT_SCAN, 0.5
    if pkt_rate > 200:
        return AttackType.DOS, 0.45
    return AttackType.BENIGN, 0.4
 
 
# --------------------------------------------------------------------------
# 2. RISK SCORING
# --------------------------------------------------------------------------
 
# Base severity weight per attack type — tunable.
_ATTACK_BASE_RISK = {
    AttackType.BENIGN: 0,
    AttackType.RECONNAISSANCE: 25,
    AttackType.PORT_SCAN: 35,
    AttackType.BRUTE_FORCE: 55,
    AttackType.WEB_ATTACK: 60,
    AttackType.DOS: 65,
    AttackType.BOTNET: 75,
    AttackType.EXPLOIT: 80,
    AttackType.INFILTRATION: 85,
    AttackType.DDOS: 90,
    AttackType.UNKNOWN_ANOMALY: 40,
}
 
 
def compute_risk_score(
    attack_type: AttackType,
    confidence: float,
    features: Optional[dict[str, Any]] = None,
) -> int:
    """
    Compute a 0-100 risk score.
 
    score = base_risk(attack_type) * confidence, then adjusted by
    contextual multipliers (asset criticality, repeat offender IP, etc.)
    Kept simple/rule-based by default; swap in `_risk_model` if you train
    a dedicated regressor.
    """
    _load_models()
    features = features or {}
 
    if _risk_model is not None:
        try:
            vec = _vectorize(features) + [confidence]
            score = float(_risk_model.predict([vec])[0])
            return int(max(0, min(100, round(score))))
        except Exception as exc:
            logger.error("Risk model inference failed, using rule-based scoring: %s", exc)
 
    base = _ATTACK_BASE_RISK.get(attack_type, 40)
    score = base * confidence
 
    # Contextual multipliers
    if features.get("targets_critical_asset"):
        score *= 1.2
    if features.get("repeat_offender"):
        score *= 1.15
    if features.get("internal_source"):
        score *= 0.9  # internal traffic slightly less alarming by default
 
    return int(max(0, min(100, round(score))))
 
 
def score_to_severity(score: int) -> ThreatLevel:
    if score >= 80:
        return ThreatLevel.CRITICAL
    if score >= 55:
        return ThreatLevel.HIGH
    if score >= 30:
        return ThreatLevel.MEDIUM
    return ThreatLevel.LOW
 
 
# --------------------------------------------------------------------------
# 3. ALERT GENERATION
# --------------------------------------------------------------------------
 
def process_flow(flow: dict[str, Any]) -> Optional[Alert]:
    """
    Main entry point called by the monitoring pipeline (e.g. from
    `pipeline/ingest.py` or `sniffer.py` after preprocessing) for each
    captured flow/packet window.
 
    `flow` is expected to contain preprocessed feature fields plus at least:
        source_ip, destination_ip, destination_port, protocol
 
    Returns an Alert if the flow is classified as non-benign, else None.
    """
    attack_type, confidence = classify_attack(flow)
 
    if attack_type == AttackType.BENIGN:
        return None
 
    risk = compute_risk_score(attack_type, confidence, flow)
    severity = score_to_severity(risk)
 
    alert = Alert(
        id=None,
        source_ip=flow.get("source_ip", "unknown"),
        destination_ip=flow.get("destination_ip", "unknown"),
        destination_port=flow.get("destination_port"),
        protocol=flow.get("protocol"),
        attack_type=attack_type,
        confidence=confidence,
        risk_score=risk,
        severity=severity,
        detected_at=datetime.now(timezone.utc),
        raw_features=flow,
    )
 
    saved = save_alert(alert)
 
    if severity in (ThreatLevel.HIGH, ThreatLevel.CRITICAL):
        notify(saved)
        attach_to_incident(saved)
 
    return saved
 
 
def save_alert(alert: Alert) -> Alert:
    """Persist alert. Replace with real DB session logic, e.g.:
 
        from database import SessionLocal
        from models import Alert as AlertModel
        db = SessionLocal()
        db_alert = AlertModel(**alert.to_dict())
        db.add(db_alert); db.commit(); db.refresh(db_alert)
        return db_alert
    """
    # Assign a local sequential id for in-memory references
    alert.id = _next_alert_id()
    _ALERTS[alert.id] = alert

    # Try to persist to MongoDB (non-blocking failure)
    try:
        db = get_mongo_db()
        if db is not None:
            coll = db.alerts
            doc = alert.to_dict()
            doc["local_id"] = alert.id
            coll.insert_one(doc)
    except Exception:
        # Swallow DB errors; in-memory store still works
        logger.debug("MongoDB alert persist failed; using in-memory store.")

    logger.info(
        "Alert #%s: %s from %s -> %s (risk=%d, severity=%s)",
        alert.id, alert.attack_type.value, alert.source_ip,
        alert.destination_ip, alert.risk_score, alert.severity.value,
    )
    return alert
 
 
def list_alerts(
    severity: Optional[ThreatLevel] = None,
    limit: int = 100,
) -> list[Alert]:
    alerts = list(_ALERTS.values())
    if severity:
        alerts = [a for a in alerts if a.severity == severity]
    alerts.sort(key=lambda a: a.detected_at, reverse=True)
    return alerts[:limit]
 
 
def acknowledge_alert(alert_id: int, analyst: str) -> Optional[Alert]:
    alert = _ALERTS.get(alert_id)
    if not alert:
        return None
    alert.acknowledged = True
    logger.info("Alert #%s acknowledged by %s", alert_id, analyst)
    return alert
 
 
# --------------------------------------------------------------------------
# 4. INCIDENT MANAGEMENT
# --------------------------------------------------------------------------
 
def attach_to_incident(alert: Alert) -> Incident:
    """
    Group an alert into an existing open incident for the same source IP
    if one exists, otherwise create a new incident.
    """
    for incident in _INCIDENTS.values():
        if incident.status in (IncidentStatus.OPEN, IncidentStatus.INVESTIGATING):
            member_alerts = [_ALERTS[aid] for aid in incident.alert_ids if aid in _ALERTS]
            if any(a.source_ip == alert.source_ip for a in member_alerts):
                incident.alert_ids.append(alert.id)
                incident.updated_at = datetime.now(timezone.utc)
                if _severity_rank(alert.severity) > _severity_rank(incident.severity):
                    incident.severity = alert.severity
                alert.incident_id = incident.id
                logger.info("Alert #%s attached to existing incident #%s", alert.id, incident.id)
                return incident
 
    incident = Incident(
        id=None,
        title=f"{alert.attack_type.value.replace('_', ' ').title()} from {alert.source_ip}",
        status=IncidentStatus.OPEN,
        severity=alert.severity,
        alert_ids=[alert.id],
    )
    incident.id = _next_incident_id()
    _INCIDENTS[incident.id] = incident
    alert.incident_id = incident.id
    logger.info("Created new incident #%s for alert #%s", incident.id, alert.id)
    return incident
 
 
def _severity_rank(level: ThreatLevel) -> int:
    return [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL].index(level)
 
 
def update_incident_status(
    incident_id: int, status: IncidentStatus, note: Optional[str] = None
) -> Optional[Incident]:
    incident = _INCIDENTS.get(incident_id)
    if not incident:
        return None
    incident.status = status
    incident.updated_at = datetime.now(timezone.utc)
    if note:
        incident.notes.append(f"[{datetime.now(timezone.utc).isoformat()}] {note}")
    logger.info("Incident #%s status -> %s", incident_id, status.value)
    return incident
 
 
def list_incidents(status: Optional[IncidentStatus] = None) -> list[Incident]:
    incidents = list(_INCIDENTS.values())
    if status:
        incidents = [i for i in incidents if i.status == status]
    incidents.sort(key=lambda i: i.updated_at, reverse=True)
    return incidents
 
 
# --------------------------------------------------------------------------
# NOTIFICATIONS
# --------------------------------------------------------------------------
 
def notify(alert: Alert) -> None:
    """Dispatch a notification for high/critical alerts. Extend with
    Slack/Teams/webhook/SIEM forwarding as needed."""
    message = (
        f"[{alert.severity.value.upper()}] {alert.attack_type.value} detected "
        f"from {alert.source_ip} -> {alert.destination_ip}"
        f"{':' + str(alert.destination_port) if alert.destination_port else ''} "
        f"(risk={alert.risk_score}, confidence={alert.confidence:.2f})"
    )
    logger.warning("ALERT NOTIFY: %s", message)
 
    if SLACK_WEBHOOK_URL:
        _send_slack(message)
    if SMTP_HOST and ALERT_EMAIL_TO:
        _send_email(
            subject=f"NetShield AI: {alert.severity.value.upper()} threat detected",
            body=message,
        )
 
 
def _send_slack(message: str) -> None:
    try:
        import urllib.request
        payload = json.dumps({"text": message}).encode("utf-8")
        req = urllib.request.Request(
            SLACK_WEBHOOK_URL, data=payload, headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as exc:
        logger.error("Slack notification failed: %s", exc)
 
 
def _send_email(subject: str, body: str) -> None:
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = ALERT_EMAIL_FROM
        msg["To"] = ALERT_EMAIL_TO
        msg.set_content(body)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
    except Exception as exc:
        logger.error("Email notification failed: %s", exc)
 
 
# --------------------------------------------------------------------------
# THREAT INTELLIGENCE / REPORTING HELPERS (for analytics dashboard routes)
# --------------------------------------------------------------------------
 
def get_threat_summary() -> dict[str, Any]:
    """Aggregate stats for the analytics/reports frontend routes."""
    alerts = list(_ALERTS.values())
    by_type: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for a in alerts:
        by_type[a.attack_type.value] = by_type.get(a.attack_type.value, 0) + 1
        by_severity[a.severity.value] = by_severity.get(a.severity.value, 0) + 1
 
    return {
        "total_alerts": len(alerts),
        "open_incidents": len(list_incidents(IncidentStatus.OPEN)),
        "by_attack_type": by_type,
        "by_severity": by_severity,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
 
 
# --------------------------------------------------------------------------
# Smoke test
# --------------------------------------------------------------------------
 
if __name__ == "__main__":
    sample_flows = [
        {
            "source_ip": "10.0.0.5", "destination_ip": "10.0.0.1",
            "destination_port": 22, "protocol": "TCP",
            "flow_packets_per_sec": 1500, "total_fwd_packets": 900,
            "syn_flag_count": 5,
        },
        {
            "source_ip": "192.168.1.20", "destination_ip": "192.168.1.1",
            "destination_port": 443, "protocol": "TCP",
            "flow_packets_per_sec": 10, "total_fwd_packets": 3,
            "syn_flag_count": 1,
        },
        {
            "source_ip": "10.0.0.5", "destination_ip": "10.0.0.7",
            "destination_port": 3389, "protocol": "TCP",
            "flow_packets_per_sec": 60, "total_fwd_packets": 40,
            "syn_flag_count": 80,
        },
    ]
 
    for flow in sample_flows:
        result = process_flow(flow)
        if result:
            print(json.dumps(result.to_dict(), indent=2, default=str))
        else:
            print(f"Flow from {flow['source_ip']} classified benign — no alert.")
 
    print("\n--- Threat Summary ---")
    print(json.dumps(get_threat_summary(), indent=2))
 
    print("\n--- Incidents ---")
    for inc in list_incidents():
        print(json.dumps(inc.to_dict(), indent=2, default=str))
 