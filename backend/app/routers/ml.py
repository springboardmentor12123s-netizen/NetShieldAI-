"""
NetShield AI — Machine learning training router.

Exposes a single endpoint that trains (or retrains) the Isolation Forest
model on the most recently uploaded training dataset.
"""

import logging
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DatasetRecord, TrainingRun
from app.services.ml_service import train_model

logger = logging.getLogger("netshield.ml")

router = APIRouter(tags=["Machine Learning"])

BACKEND_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = BACKEND_DIR / "saved_models" / "isolation_forest.joblib"
UPLOAD_DIR = BACKEND_DIR / "uploads"

# Chunk size for reading large CSV files (Part 5 — memory safety).
_CSV_CHUNK_SIZE = 50_000


def _read_csv_chunked(path: Path) -> pd.DataFrame:
    """
    Read a CSV in chunks to avoid excessive peak memory usage on large files.

    Falls back to a single read for small files (< 10 MB).
    """
    file_size = path.stat().st_size
    if file_size < 10 * 1024 * 1024:  # < 10 MB — read in one shot
        return pd.read_csv(path, low_memory=False)

    chunks: list[pd.DataFrame] = []
    for chunk in pd.read_csv(path, chunksize=_CSV_CHUNK_SIZE, low_memory=False):
        chunks.append(chunk)
    return pd.concat(chunks, ignore_index=True)


def _find_compatible_csvs(
    primary_columns: list[str],
    primary_stored_name: str,
) -> list[Path]:
    """
    Scan the uploads directory for CSV files whose columns are a superset
    of *primary_columns* (i.e., schema-compatible for concatenation).

    Skips the primary file itself to avoid double-counting.
    """
    compatible: list[Path] = []
    primary_set = set(primary_columns)

    for csv_path in sorted(UPLOAD_DIR.glob("*.csv")):
        if csv_path.name == primary_stored_name:
            continue
        # Only inspect the header to avoid loading the entire file.
        try:
            header_df = pd.read_csv(csv_path, nrows=0)
            if primary_set.issubset(set(header_df.columns)):
                compatible.append(csv_path)
        except Exception:
            continue  # Skip malformed files silently.

    return compatible


def _print_database_stats(
    db: Session,
    *,
    total_fetched: int,
    train_rows: int,
    test_rows: int,
) -> None:
    """Print database and dataset statistics to the terminal before training."""
    total_db_rows = db.scalar(
        select(func.coalesce(func.sum(DatasetRecord.row_count), 0))
    ) or 0

    separator = "-" * 56
    logger.info(f"""
{separator}
  DATABASE / DATASET STATISTICS
{separator}

  Total rows in database : {total_db_rows:>12,}
  Rows fetched (combined): {total_fetched:>12,}
  Training rows (75%)    : {train_rows:>12,}
  Testing rows  (25%)    : {test_rows:>12,}

{separator}
""")


@router.post("/train")
def train(dataset_id: int | None = None, db: Session = Depends(get_db)):
    """
    Train the Isolation Forest on the latest (or specified) training dataset.

    When compatible CSV files exist in the uploads directory, they are
    concatenated with the primary dataset to maximise the training data.

    Persists the trained model to disk and records evaluation metrics in the
    TrainingRun table.  Returns the full metrics dict alongside dataset info.
    """
    query = select(DatasetRecord).where(DatasetRecord.purpose == "training")
    if dataset_id is not None:
        query = query.where(DatasetRecord.id == dataset_id)
    query = query.order_by(DatasetRecord.uploaded_at.desc())
    dataset = db.scalars(query).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Upload a training dataset first.")

    # --- Load the primary dataset using chunk-based reading ----------------
    primary_path = UPLOAD_DIR / dataset.stored_name
    frame = _read_csv_chunked(primary_path)
    primary_columns = list(frame.columns)
    logger.info("Primary dataset: %s (%d rows)", dataset.stored_name, len(frame))

    # --- Scan for and concatenate compatible CSV files ---------------------
    compatible_paths = _find_compatible_csvs(primary_columns, dataset.stored_name)
    if compatible_paths:
        extra_frames = []
        for csv_path in compatible_paths:
            try:
                extra = _read_csv_chunked(csv_path)
                # Only keep columns present in the primary dataset.
                extra = extra[primary_columns]
                extra_frames.append(extra)
                logger.info("  + %s (%d rows)", csv_path.name, len(extra))
            except Exception as exc:
                logger.warning("  Skipped %s: %s", csv_path.name, exc)
        if extra_frames:
            frame = pd.concat([frame] + extra_frames, ignore_index=True)
            # Drop exact-duplicate rows to avoid inflating the dataset.
            before = len(frame)
            frame = frame.drop_duplicates()
            if len(frame) < before:
                logger.info("  Dropped %d duplicate rows", before - len(frame))

    total_fetched = len(frame)
    train_rows = int(total_fetched * 0.75)
    test_rows = total_fetched - train_rows

    # --- Print DB / dataset statistics (Part 4) ---------------------------
    _print_database_stats(
        db,
        total_fetched=total_fetched,
        train_rows=train_rows,
        test_rows=test_rows,
    )

    if total_fetched < 1_000_000:
        logger.info(
            f"  [INFO] Combined dataset has {total_fetched:,} rows (< 1,000,000).\n"
            f"         The original data does not contain 1M unique rows.\n"
            f"         All available records have been loaded.\n"
        )

    # --- Train the model --------------------------------------------------
    metrics = train_model(frame, MODEL_PATH)
    matrix = metrics["confusion_matrix"]
    run = TrainingRun(
        dataset_id=dataset.id,
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        tn=matrix[0][0],
        fp=matrix[0][1],
        fn=matrix[1][0],
        tp=matrix[1][1],
        feature_count=metrics["feature_count"],
    )
    dataset.accuracy = metrics["accuracy"]
    db.add(run)
    db.commit()
    return {"dataset_id": dataset.id, "dataset_name": dataset.original_name, **metrics}
