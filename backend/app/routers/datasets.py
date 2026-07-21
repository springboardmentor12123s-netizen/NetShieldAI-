from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, DatasetRecord
from app.services.file_service import dataframe_preview, save_csv
from app.services.ml_service import predict
from app.services.report_service import build_and_save_report

router = APIRouter(tags=["Datasets"])
BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BACKEND_DIR / "uploads"
PREDICTION_DIR = BACKEND_DIR / "predictions"
MODEL_PATH = BACKEND_DIR / "saved_models" / "isolation_forest.joblib"


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    path, frame = await save_csv(file, UPLOAD_DIR)
    record = DatasetRecord(
        original_name=file.filename or "dataset.csv",
        stored_name=path.name,
        purpose="training",
        row_count=len(frame),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "name": record.original_name,
        "row_count": record.row_count,
        "columns": [str(column).strip() for column in frame.columns],
        "preview": dataframe_preview(frame),
    }


@router.post("/predict")
async def predict_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    path, frame = await save_csv(file, UPLOAD_DIR)

    # predict() now returns (enriched_df, supervised_metrics | None)
    output, supervised_metrics = predict(frame, MODEL_PATH)

    anomaly_indices = output.index[output["Prediction"] == "Anomaly"].tolist()
    anomaly_count = len(anomaly_indices)
    severity = (
        "Low" if anomaly_count == 1
        else "Medium" if 2 <= anomaly_count <= 5
        else "High" if anomaly_count > 5
        else "None"
    )

    record = DatasetRecord(
        original_name=file.filename or "prediction.csv",
        stored_name=path.name,
        purpose="prediction",
        row_count=len(output),
        normal_count=len(output) - anomaly_count,
        attack_count=anomaly_count,
        prediction_count=anomaly_count,
    )
    db.add(record)
    db.flush()
    for index in anomaly_indices:
        db.add(Alert(dataset_id=record.id, row_number=int(index) + 1, severity=severity))

    PREDICTION_DIR.mkdir(parents=True, exist_ok=True)
    result_name = f"predictions_{record.id}.csv"
    output.to_csv(PREDICTION_DIR / result_name, index=False)
    db.commit()

    # Build and persist threat report (non-blocking – errors are logged, not raised)
    try:
        build_and_save_report(output, db, supervised_metrics=supervised_metrics)
    except Exception:
        pass  # Report generation failure must not break the predict response

    response: dict = {
        "dataset_id": record.id,
        "total_rows": len(output),
        "anomaly_count": anomaly_count,
        "normal_count": len(output) - anomaly_count,
        "severity": severity,
        "preview": dataframe_preview(output),
        "download_url": f"/api/predictions/{record.id}/download",
    }
    if supervised_metrics:
        response["supervised_metrics"] = supervised_metrics

    return response


@router.get("/predictions/{dataset_id}/download")
def download_predictions(dataset_id: int, db: Session = Depends(get_db)):
    record = db.get(DatasetRecord, dataset_id)
    path = PREDICTION_DIR / f"predictions_{dataset_id}.csv"
    if not record or not path.exists():
        raise HTTPException(status_code=404, detail="Prediction file not found.")
    return FileResponse(path, media_type="text/csv", filename=f"netshield_{record.original_name}")
