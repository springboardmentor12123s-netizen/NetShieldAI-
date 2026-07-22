"""NetShield AI - Celery Application Configuration."""

import os
from celery import Celery
from celery.schedules import crontab

# Configure environment variables defaults
os.environ.setdefault("CELERY_BROKER_URL", "redis://redis:6379/5")
os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://redis:6379/5")

broker_url = os.environ.get("CELERY_BROKER_URL")
result_backend = os.environ.get("CELERY_RESULT_BACKEND")

celery_app = Celery(
    "netshield_tasks",
    broker=broker_url,
    backend=result_backend,
    include=[
        "app.tasks.packet_tasks",
        "app.tasks.report_tasks",
        "app.tasks.cleanup_tasks",
        "app.tasks.analytics_tasks",
    ],
)

# Optional configurations
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max task execution
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Celery Beat tasks scheduling
celery_app.conf.beat_schedule = {
    "cleanup-expired-sessions-hourly": {
        "task": "app.tasks.cleanup_tasks.cleanup_expired_sessions",
        "schedule": crontab(minute=0),  # Top of every hour
    },
    "cleanup-old-traffic-daily": {
        "task": "app.tasks.cleanup_tasks.cleanup_old_traffic",
        "schedule": crontab(hour=3, minute=0),  # Daily at 3:00 AM
    },
    "compute-analytics-every-5-min": {
        "task": "app.tasks.analytics_tasks.compute_analytics",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    "generate-daily-report-daily": {
        "task": "app.tasks.report_tasks.generate_daily_report",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2:00 AM
    },
}
