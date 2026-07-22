"""NetShield AI - Automated Security Reporting Background Tasks."""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone, timedelta

from app.tasks.celery_app import celery_app
from app.core.mongodb import MongoDBManager
from app.repositories.traffic_repository import TrafficRepository

logger = logging.getLogger("app")


def run_async(coro):
    """Run an async coroutine synchronously inside Celery worker."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task
def generate_daily_report() -> str:
    """Generate daily security analysis and dump traffic summary report files."""
    async def _generate():
        await MongoDBManager.connect()
        try:
            db = MongoDBManager.get_database()
            repo = TrafficRepository(db)

            # Read 24 hours metrics
            stats = await repo.get_stats(hours=24)
            analytics = await repo.get_analytics(hours=24)

            timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            report_data = {
                "report_metadata": {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "title": "NetShield AI daily traffic summary report",
                    "window": "Last 24 Hours",
                },
                "telemetry_stats": stats,
                "flow_analytics": analytics,
            }

            # Enforce output directory in logs/reports
            reports_dir = "/app/logging/reports"
            if not os.path.exists(reports_dir):
                os.makedirs(reports_dir, exist_ok=True)

            filepath = os.path.join(reports_dir, f"traffic_report_{timestamp_str}.json")
            with open(filepath, "w") as f:
                json.dump(report_data, f, indent=4)

            msg = f"Generated daily traffic summary audit file: {filepath}"
            logger.info(msg)
            return msg
        finally:
            await MongoDBManager.disconnect()

    try:
        return run_async(_generate())
    except Exception as e:
        err_msg = f"Failed task generate_daily_report: {e}"
        logger.error(err_msg)
        return err_msg
