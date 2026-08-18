import os
import json
import pytest
from app.ai.prediction.predictor import ThreatPredictor

@pytest.fixture
def predictor():
    pred = ThreatPredictor()
    if not pred.is_loaded:
        pred.load_models()
    return pred

def test_threat_predictor_caching(predictor):
    # Verify singleton caching behavior
    pred2 = ThreatPredictor()
    assert pred2 is predictor
    assert predictor.is_loaded is True

def test_single_prediction_correctness(predictor):
    # Test packet dictionary
    packet = {
        "dst_port": 80,
        "bytes_sent": 1500,
        "bytes_received": 3000,
        "packet_count": 20,
        "duration_ms": 100,
        "flags": ["SYN"]
    }
    
    result = predictor.predict_log(packet)
    assert isinstance(result, dict)
    assert "is_anomaly" in result
    assert "anomaly_score" in result
    assert "predicted_label" in result
    assert "risk_score" in result
    assert isinstance(result["is_anomaly"], bool)
    assert isinstance(result["anomaly_score"], float)
    assert isinstance(result["risk_score"], float)
    assert isinstance(result["predicted_label"], str)

def test_batch_prediction_correctness(predictor):
    packets = [
        {
            "dst_port": 80,
            "bytes_sent": 1000 + i * 100,
            "bytes_received": 2000 - i * 50,
            "packet_count": 10,
            "duration_ms": 50,
            "flags": ["SYN", "ACK"]
        } for i in range(5)
    ]
    
    results = predictor.predict_batch(packets)
    assert len(results) == len(packets)
    for result in results:
        assert "is_anomaly" in result
        assert "anomaly_score" in result
        assert "predicted_label" in result
        assert "risk_score" in result
        assert isinstance(result["is_anomaly"], bool)
        assert isinstance(result["anomaly_score"], float)

def test_benchmark_schema_generation():
    # Verify structure matches target schema format
    # Check that performance_benchmark can be parsed and holds correct keys
    reports_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "reports"
    )
    benchmark_path = os.path.join(reports_dir, "performance_benchmark.json")
    
    # If the benchmark file exists (or is created after a run), we check it
    if os.path.exists(benchmark_path):
        with open(benchmark_path, "r") as f:
            data = json.load(f)
            
        assert "timestamp" in data
        assert "single_prediction" in data
        assert "average_latency_ms" in data["single_prediction"]
        assert "min_latency_ms" in data["single_prediction"]
        assert "max_latency_ms" in data["single_prediction"]
        
        assert "batch_prediction" in data
        assert "batch_size" in data["batch_prediction"]
        assert "average_latency_ms" in data["batch_prediction"]
        assert "throughput_predictions_per_second" in data["batch_prediction"]
        
        assert "traffic_ingestion" in data
        assert "average_latency_ms" in data["traffic_ingestion"]
        
        assert "api" in data
        assert "/traffic/ml/status" in data["api"]
        assert "/traffic/ml/predict" in data["api"]
