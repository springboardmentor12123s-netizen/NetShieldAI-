from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List


THREAT_KEYWORDS = {
    "DDoS": {"severity": "high", "risk": 92},
    "PortScan": {"severity": "medium", "risk": 76},
    "BruteForce": {"severity": "high", "risk": 88},
    "WebAttack": {"severity": "high", "risk": 84},
    "Infiltration": {"severity": "critical", "risk": 95},
    "BENIGN": {"severity": "low", "risk": 12},
    "NORMAL": {"severity": "low", "risk": 12},
}


def normalize_label(value: Any) -> str:
    if value is None:
        return "BENIGN"

    label = str(value).strip()
    if not label:
        return "BENIGN"

    normalized = label.upper()
    if normalized in {"0", "NORMAL", "BENIGN"}:
        return "BENIGN"

    if normalized == "DDOS":
        return "DDoS"
    if normalized == "PORTSCAN":
        return "PortScan"
    if normalized == "BRUTEFORCE":
        return "BruteForce"
    if normalized == "WEBATTACK":
        return "WebAttack"
    if normalized == "INFILTRATION":
        return "Infiltration"

    return label.title()


def classify_threat(packet: Dict[str, Any]) -> Dict[str, Any]:
    label = normalize_label(packet.get("Label") or packet.get("label") or packet.get("Attack Type") or packet.get("Class"))
    profile = THREAT_KEYWORDS.get(label, {"severity": "medium", "risk": 70})

    risk_score = profile["risk"]
    if packet.get("Total Fwd Packets", 0) > 30:
        risk_score = min(100, risk_score + 4)
    if packet.get("Flow Duration", 0) > 1000:
        risk_score = min(100, risk_score + 3)

    return {
        "category": label,
        "severity": profile["severity"],
        "risk_score": risk_score,
        "source_ip": packet.get("Source IP") or packet.get("src_ip") or "unknown",
        "destination_ip": packet.get("Destination IP") or packet.get("dst_ip") or "unknown",
        "destination_port": packet.get("Destination Port") or packet.get("DestPort") or 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def build_dashboard_snapshot(packets: List[Dict[str, Any]]) -> Dict[str, Any]:
    classified = [classify_threat(packet) for packet in packets]
    breakdown = Counter(item["category"] for item in classified)
    critical_alerts = sum(1 for item in classified if item["severity"] in {"high", "critical"})

    high_risk = sorted(classified, key=lambda item: item["risk_score"], reverse=True)[:5]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_packets": len(classified),
        "threat_breakdown": {key: breakdown.get(key, 0) for key in sorted(breakdown)},
        "critical_alerts": critical_alerts,
        "high_risk_alerts": high_risk,
        "risk_score_avg": round(sum(item["risk_score"] for item in classified) / len(classified), 1) if classified else 0,
    }
