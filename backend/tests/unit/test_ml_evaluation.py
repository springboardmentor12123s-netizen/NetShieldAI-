"""Unit tests for ML evaluation endpoints, metrics, and preprocessor/model loading."""

import os
import sys
import pytest
import numpy as np
from unittest.mock import patch, MagicMock

# Force backend path insertion
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_dir, "..", ".."))

from app.ai.preprocessing.preprocessor import NetworkTrafficPreprocessor
from app.ai.models.anomaly_detector import AnomalyDetector
from app.ai.models.threat_classifier import ThreatClassifier
from app.ai.prediction.predictor import ThreatPredictor
from app.api.v1.traffic_ml import get_ml_evaluation, get_confusion_matrix_image


def test_models_exist():
    """Verify saved model joblib files are present in the models directory."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    save_dir = os.path.join(base_dir, "app", "ai", "models", "saved")
    
    assert os.path.exists(os.path.join(save_dir, "preprocessor.joblib"))
    assert os.path.exists(os.path.join(save_dir, "anomaly_detector.joblib"))
    assert os.path.exists(os.path.join(save_dir, "threat_classifier.joblib"))


def test_preprocessor_loading():
    """Verify that NetworkTrafficPreprocessor can be loaded and check attributes."""
    predictor = ThreatPredictor()
    assert predictor.preprocessor is not None
    assert isinstance(predictor.preprocessor, NetworkTrafficPreprocessor)
    assert predictor.preprocessor.is_fitted is True


def test_anomaly_detector_loading():
    """Verify that AnomalyDetector can be loaded and carries IsolationForest model."""
    predictor = ThreatPredictor()
    assert predictor.detector is not None
    assert isinstance(predictor.detector, AnomalyDetector)
    assert predictor.detector.is_trained is True
    assert predictor.detector.model is not None


def test_threat_classifier_loading():
    """Verify that ThreatClassifier wrapper can be loaded and carries RandomForest."""
    predictor = ThreatPredictor()
    assert predictor.classifier is not None
    assert isinstance(predictor.classifier, ThreatClassifier)
    assert predictor.classifier.is_trained is True
    assert predictor.classifier.model is not None


def test_prediction_custom_log_valid_invalid():
    """Test predictor handling of valid and invalid packet schemas."""
    predictor = ThreatPredictor()
    
    # Valid sample packet
    valid_packet = {
        "dst_port": 80,
        "bytes_sent": 1500,
        "bytes_received": 3000,
        "packet_count": 20,
        "duration_ms": 100,
        "flags": ["SYN"]
    }
    
    res = predictor.predict_log(valid_packet)
    assert "is_anomaly" in res
    assert "predicted_label" in res
    assert "risk_score" in res
    assert isinstance(res["is_anomaly"], bool)
    assert isinstance(res["predicted_label"], str)
    
    # Invalid/Empty packet (should handle safely via error fallback normal)
    invalid_packet = {"invalid_field": "test"}
    res_invalid = predictor.predict_log(invalid_packet)
    assert res_invalid["predicted_label"] == "Normal" or "Error Fallback" in res_invalid["predicted_label"]
    assert res_invalid["is_anomaly"] is False
    assert res_invalid["risk_score"] < 0.2


def test_get_ml_evaluation_endpoint():
    """Test the GET /traffic/ml/evaluation handler directly."""
    res = get_ml_evaluation(current_user={})
    assert res.data is not None
    assert "accuracy" in res.data
    assert "precision" in res.data
    assert "confusion_matrix" in res.data
    assert "class_wise" in res.data
    assert isinstance(res.data["confusion_matrix"], list)


def test_get_confusion_matrix_image_endpoint():
    """Test the GET /traffic/ml/confusion-matrix image response path."""
    res = get_confusion_matrix_image(current_user={})
    assert res is not None
    assert getattr(res, "media_type", None) == "image/png"
    assert os.path.exists(res.path)


def test_evaluation_artifacts():
    """Verify that all Milestone 4 ML evaluation reports exist and have correct formats."""
    # Find reports directory relative to this test file
    test_dir = os.path.dirname(os.path.abspath(__file__))
    reports_dir = os.path.abspath(os.path.join(test_dir, "..", "..", "..", "reports"))
    
    eval_path = os.path.join(reports_dir, "ai_model_evaluation.json")
    cm_path = os.path.join(reports_dir, "confusion_matrix.png")
    report_path = os.path.join(reports_dir, "classification_report.json")
    
    # Assert physical file existence
    assert os.path.exists(eval_path), f"File {eval_path} not found"
    assert os.path.exists(cm_path), f"File {cm_path} not found"
    assert os.path.exists(report_path), f"File {report_path} not found"
    
    # Verify ai_model_evaluation.json format
    import json
    with open(eval_path, "r", encoding="utf-8") as f:
        eval_data = json.load(f)
        
    assert "accuracy" in eval_data
    assert "precision" in eval_data
    assert "recall" in eval_data
    assert "f1_score" in eval_data
    assert "confusion_matrix" in eval_data
    assert "classification_report" in eval_data
    assert "test_cases" in eval_data
    
    # Verify confusion matrix properties
    cm = eval_data["confusion_matrix"]
    assert isinstance(cm, list)
    assert len(cm) > 0
    assert all(isinstance(row, list) for row in cm)
    assert all(len(row) == len(cm) for row in cm)
    
    # Verify classification_report.json format
    with open(report_path, "r", encoding="utf-8") as f:
        report_data = json.load(f)
        
    assert "accuracy" in report_data
    assert "macro avg" in report_data
    assert "weighted avg" in report_data

