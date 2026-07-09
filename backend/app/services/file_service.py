import math
import uuid
from pathlib import Path

import pandas as pd
from fastapi import HTTPException, UploadFile

MAX_FILE_SIZE = 50 * 1024 * 1024


def clean_value(value):
    if pd.isna(value):
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value.item() if hasattr(value, "item") else value


def dataframe_preview(frame: pd.DataFrame, limit: int = 20) -> list[dict]:
    return [
        {str(column).strip(): clean_value(value) for column, value in row.items()}
        for row in frame.head(limit).to_dict(orient="records")
    ]


async def save_csv(upload: UploadFile, destination: Path) -> tuple[Path, pd.DataFrame]:
    if not upload.filename or Path(upload.filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds the 50 MB limit.")

    destination.mkdir(parents=True, exist_ok=True)
    stored_path = destination / f"{uuid.uuid4().hex}.csv"
    stored_path.write_bytes(content)
    try:
        frame = pd.read_csv(stored_path, low_memory=False)
    except Exception as exc:
        stored_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Could not read CSV: {exc}") from exc

    if frame.empty:
        stored_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="CSV must contain at least one data row.")
    return stored_path, frame
