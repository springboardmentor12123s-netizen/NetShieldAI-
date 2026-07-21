"""
Composite Risk Scoring Engine (Milestone 2 - "generate risk scoring system").

Combines the unsupervised anomaly ensemble score, the supervised attack
classification confidence, and a small set of severity weights per attack
type into a single 0-100 risk score, matching the architecture diagram's
"6. Risk Scoring" block (Threat Score 0-100, Low/Med/High/Critical level).
"""

ATTACK_SEVERITY_WEIGHT = {
    "benign": 0.0,
    "port_scan": 0.5,
    "brute_force": 0.7,
    "dos_flood": 0.85,
    "data_exfiltration": 1.0,
}
DEFAULT_SEVERITY_WEIGHT = 0.6  # unrecognized/dataset-specific attack labels


def compute_risk_score(ensemble_anomaly_score: float, attack_type: str, attack_confidence: float) -> tuple[float, str]:
    """
    risk_score = weighted blend of:
      - anomaly ensemble score   (40%) — "is this unusual at all"
      - attack severity weight   (40%) — "how bad is this category of attack"
      - classifier confidence    (20%) — "how sure are we"
    Scaled to 0-100.
    """
    severity = ATTACK_SEVERITY_WEIGHT.get(attack_type, DEFAULT_SEVERITY_WEIGHT)
    confidence_component = attack_confidence if attack_type != "benign" else (1 - attack_confidence) * 0.3

    raw = (0.4 * ensemble_anomaly_score) + (0.4 * severity) + (0.2 * confidence_component)
    score = round(min(max(raw, 0.0), 1.0) * 100, 2)

    if score < 25:
        level = "low"
    elif score < 50:
        level = "medium"
    elif score < 75:
        level = "high"
    else:
        level = "critical"

    return score, level
