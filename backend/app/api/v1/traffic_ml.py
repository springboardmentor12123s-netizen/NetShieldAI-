"""NetShield AI - Traffic ML API Routes."""

import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
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


@router.get("/evaluation")
def get_ml_evaluation(
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Returns the custom model validation and accuracy reports from Milestone 4."""
    root_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".."))
    eval_path = os.path.join(root_dir, "reports", "ai_model_evaluation.json")
    
    if not os.path.exists(eval_path):
        raise HTTPException(
            status_code=404, 
            detail="Evaluation reports not available. Please run evaluation script first using CLI."
        )
        
    try:
        with open(eval_path, mode="r", encoding="utf-8") as f:
            data = json.load(f)
        return APIResponse(data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load evaluation results: {e}")


@router.get("/confusion-matrix")
def get_confusion_matrix_image(
    current_user: dict = Depends(require_roles(["admin", "security_analyst"])),
):
    """Returns the confusion matrix visualization as a PNG image."""
    root_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".."))
    img_path = os.path.join(root_dir, "reports", "confusion_matrix.png")
    
    if not os.path.exists(img_path):
        raise HTTPException(
            status_code=404, 
            detail="Confusion matrix image not found. Perform evaluation first."
        )
        
    return FileResponse(img_path, media_type="image/png")
