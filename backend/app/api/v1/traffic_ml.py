"""NetShield AI - Traffic ML API Routes."""

import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from typing import Dict, Any

from app.core.dependencies import require_roles
from app.ai.prediction.predictor import ThreatPredictor
from app.schemas.common import APIResponse

router = APIRouter(prefix="/traffic/ml", tags=["Traffic ML"])


@router.get("/status")
def get_ml_status(
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Check if the threat detection and classification models are loaded.
    
    Returns standard status.
    """
    predictor = ThreatPredictor()
    # Attempt to reload if not loaded
    if not predictor.is_loaded:
        predictor.load_models()
        
    return {
        "status": "active" if predictor.is_loaded else "inactive",
        "models": {
            "preprocessor": predictor.preprocessor_path if os.path.exists(predictor.preprocessor_path) else None,
            "anomaly_detector": predictor.detector_path if os.path.exists(predictor.detector_path) else None,
            "threat_classifier": predictor.classifier_path if os.path.exists(predictor.classifier_path) else None,
        }
    }


@router.get("/metrics")
def get_ml_metrics(
    format: str = "json",
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Returns the latest ML model evaluation performance results.
    
    Accepts format='json' or format='html'.
    """
    reports_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
        "docs",
        "reports"
    )
    
    if format == "html":
        html_path = os.path.join(reports_dir, "anomaly_detection_report.html")
        if not os.path.exists(html_path):
            raise HTTPException(status_code=404, detail="HTML performance report not found. Execute training first.")
        with open(html_path, mode="r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
        
    json_path = os.path.join(reports_dir, "anomaly_detection_report.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="JSON performance report not found. Execute training first.")
    with open(json_path, mode="r", encoding="utf-8") as f:
        metrics = json.load(f)
    return APIResponse(data=metrics)


@router.post("/predict")
def predict_custom_log(
    packet: Dict[str, Any],
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Perform real-time detection on a single custom packet payload."""
    predictor = ThreatPredictor()
    if not predictor.is_loaded:
        predictor.load_models()
        if not predictor.is_loaded:
            raise HTTPException(status_code=503, detail="Machine learning models are not loaded. Train the models first using CLI.")
            
    prediction = predictor.predict_log(packet)
    return APIResponse(data=prediction)
