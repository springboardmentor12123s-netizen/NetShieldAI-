"""
Settings page backend: MongoDB/PostgreSQL connection status (placeholders,
never expose credentials), AI config, theme, and notification preferences.
"""
from fastapi import APIRouter, Depends

from app.auth import get_current_user, require_role
from app.config import settings
from app.database import app_settings_collection, check_connection
from app.models import AppSettingsUpdate
from app.postgres_db import check_postgres_connection

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_APP_SETTINGS = {
    "ai_confidence_threshold": 70.0,
    "theme": "dark",
    "notifications_enabled": True,
    "notify_on_critical": True,
}


def _mask(uri: str) -> str:
    if not uri:
        return "Not configured"
    if "@" in uri:
        scheme_and_creds, host_part = uri.rsplit("@", 1)
        scheme = scheme_and_creds.split("://")[0]
        return f"{scheme}://****:****@{host_part}"
    return uri


@router.get("")
async def get_settings(current_user=Depends(get_current_user)):
    mongo_connected = await check_connection()
    postgres_connected = await check_postgres_connection()

    doc = await app_settings_collection.find_one({"_id": "app_settings"}) or {}
    app_prefs = {**DEFAULT_APP_SETTINGS, **{k: v for k, v in doc.items() if k != "_id"}}

    return {
        "mongodb": {
            "uri": _mask(settings.mongo_uri),
            "db_name": settings.mongo_db_name,
            "connected": mongo_connected,
        },
        "postgresql": {
            "uri": _mask(settings.postgres_uri),
            "connected": postgres_connected,
            "configured": bool(settings.postgres_uri),
        },
        "smtp": {
            "server": settings.smtp_server or "Not configured",
            "port": settings.smtp_port,
            "from_email": settings.smtp_email or "Not configured",
            "configured": settings.smtp_configured,
            "critical_alerts_enabled": settings.critical_alerts_enabled,
            "critical_alert_risk_threshold": settings.critical_alert_risk_threshold,
        },
        "ai": {
            "model_path": settings.model_path,
            "dataset_path": settings.dataset_path,
        },
        "preferences": app_prefs,
    }


@router.put("/preferences")
async def update_preferences(payload: AppSettingsUpdate, current_user=Depends(require_role("admin"))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await app_settings_collection.update_one(
            {"_id": "app_settings"}, {"$set": updates}, upsert=True
        )
    doc = await app_settings_collection.find_one({"_id": "app_settings"}) or {}
    return {**DEFAULT_APP_SETTINGS, **{k: v for k, v in doc.items() if k != "_id"}}
