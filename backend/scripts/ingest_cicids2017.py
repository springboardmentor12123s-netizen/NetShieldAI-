import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.services.ingestion import ingest_cicids2017_file

async def main():
    if len(sys.argv) < 2:
        print("Usage: python ingest_cicids2017.py <path_to_csv>"); sys.exit(1)
    await ingest_cicids2017_file(sys.argv[1])
    print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
