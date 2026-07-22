"""CLI Script to command dataset parser and store results in MongoDB."""

import asyncio
import os
import sys

# Append backend folder to system python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.ai.datasets.loader import DatasetLoader
from app.core.mongodb import MongoDBManager


async def main():
    print("NetShield AI - Initializing Dataset Ingestion...")
    loader = DatasetLoader()
    try:
        results = await loader.ingest_all()
        print("\n--- Ingestion Report ---")
        print(f"CICIDS2017 Sample Records Ingested: {results.get('cicids2017', 0)}")
        print(f"UNSW-NB15 Sample Records Ingested:  {results.get('unswnb15', 0)}")
        print("------------------------")
        print("Dataset loading finished successfully.")
    except Exception as e:
        print(f"\nFATAL: Ingestion failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await MongoDBManager.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
