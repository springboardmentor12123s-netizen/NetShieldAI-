"""
NetShield AI — CSV file handling utilities.

Provides helpers for validating, storing, and previewing uploaded CSV files.
"""

import math
import uuid
from pathlib import Path

import pandas as pd
from fastapi import HTTPException, UploadFile

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def clean_value(value):
    """
    Normalise a single DataFrame cell value for JSON serialisation.

    Converts NaN/Inf floats to None and unwraps NumPy scalar types
    so the result is always a native Python type.
    """
    if pd.isna(value):
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value.item() if hasattr(value, "item") else value


def dataframe_preview(frame: pd.DataFrame, limit: int = 20) -> list[dict]:
    """Return up to *limit* rows as a list of JSON-safe dicts."""
    return [
        {str(column).strip(): clean_value(value) for column, value in row.items()}
        for row in frame.head(limit).to_dict(orient="records")
    ]


async def save_csv(upload: UploadFile, destination: Path) -> tuple[Path, pd.DataFrame]:
    """
    Validate, store, and parse an uploaded CSV file.

    Parameters
    ----------
    upload : UploadFile
        The incoming multipart file.
    destination : Path
        Directory where the file will be stored.

    Returns
    -------
    tuple[Path, pd.DataFrame]
        The path to the stored file and the parsed DataFrame.

    Raises
    ------
    HTTPException
        400 if the file is not a valid, non-empty CSV.
        413 if the file exceeds MAX_FILE_SIZE.
    """
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
