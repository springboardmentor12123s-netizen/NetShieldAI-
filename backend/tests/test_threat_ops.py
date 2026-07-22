from threat_ops import classify_threat, build_dashboard_snapshot


def test_classify_threat_maps_ddos_to_high_risk():
    packet = {
        "Label": "DDoS",
        "Source IP": "198.51.100.10",
        "Destination IP": "203.0.113.5",
        "Destination Port": 80,
        "Flow Duration": 1200,
        "Total Fwd Packets": 50,
    }

    result = classify_threat(packet)

    assert result["category"] == "DDoS"
    assert result["severity"] == "high"
    assert result["risk_score"] >= 85


def test_dashboard_snapshot_groups_threats():
    packets = [
        {"Label": "DDoS", "Destination Port": 80, "Flow Duration": 1200, "Total Fwd Packets": 50},
        {"Label": "PortScan", "Destination Port": 22, "Flow Duration": 300, "Total Fwd Packets": 10},
        {"Label": "BENIGN", "Destination Port": 443, "Flow Duration": 800, "Total Fwd Packets": 4},
    ]

    snapshot = build_dashboard_snapshot(packets)

    assert snapshot["threat_breakdown"]["DDoS"] == 1
    assert snapshot["threat_breakdown"]["PortScan"] == 1
    assert snapshot["critical_alerts"] >= 1
