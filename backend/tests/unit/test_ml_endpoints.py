"""Unit tests for ML endpoints and threat prediction services."""

import pytest
from unittest.mock import patch, MagicMock

from app.ai.prediction.predictor import ThreatPredictor
from app.ai.preprocessing.preprocessor import NetworkTrafficPreprocessor
from app.api.v1.traffic_ml import get_ml_status, get_ml_metrics, predict_custom_log


@pytest.fixture
def sample_packet():
    return {
        "src_ip": "192.168.1.50",
        "dst_ip": "10.0.0.5",
        "src_port": 45312,
        "dst_port": 80,
        "protocol": "TCP",
        "bytes_sent": 500,
        "bytes_received": 12000,
        "packet_count": 15,
        "flags": ["SYN", "ACK"],
        "duration_ms": 120,
        "metadata": {"dataset": "cicids2017", "label": "BENIGN"}
    }


def test_predictor_loaded():
    """Ensure ThreatPredictor loaded the models properly."""
    predictor = ThreatPredictor()
    assert predictor.is_loaded is True
    assert predictor.preprocessor is not None
    assert predictor.detector is not None
    assert predictor.classifier is not None


def test_predictor_raw_inference(sample_packet):
    """Ensure predictor runs prediction on a raw dictionary log."""
    predictor = ThreatPredictor()
    pred = predictor.predict_log(sample_packet)
    
    assert "is_anomaly" in pred
    assert "anomaly_score" in pred
    assert "predicted_label" in pred
    assert "risk_score" in pred
    
    assert isinstance(pred["is_anomaly"], bool)
    assert isinstance(pred["anomaly_score"], float)
    assert isinstance(pred["predicted_label"], str)
    assert isinstance(pred["risk_score"], float)
    assert 0.0 <= pred["risk_score"] <= 1.0


def test_ml_status_endpoint():
    """Test GET /api/v1/traffic/ml/status handler directly."""
    res = get_ml_status(current_user={})
    assert res["status"] == "active"
    assert "models" in res
    assert res["models"]["preprocessor"] is not None


def test_ml_metrics_endpoint():
    """Test GET /api/v1/traffic/ml/metrics handler directly."""
    res = get_ml_metrics(format="json", current_user={})
    assert res.data is not None
    assert "dataset_size" in res.data
    assert "threat_classifier_accuracy" in res.data
    assert res.data["threat_classifier_accuracy"] > 0.9


def test_ml_predict_endpoint(sample_packet):
    """Test POST /api/v1/traffic/ml/predict handler directly."""
    res = predict_custom_log(sample_packet, current_user={})
    assert res.data is not None
    assert "is_anomaly" in res.data
    assert "risk_score" in res.data
    assert "predicted_label" in res.data
