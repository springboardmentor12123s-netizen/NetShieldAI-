"""NetShield AI - Generic Helper Utilities."""

import json
from datetime import datetime, timezone
from typing import Any


def datetime_utc_now() -> datetime:
    """Standardized timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def format_bytes_metric(size_bytes: int) -> str:
    """Convert raw byte sizes to human-readable bandwidth formats."""
    if size_bytes == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB", "PB"]
    i = 0
    while size_bytes >= 1024 and i < len(units) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.2f} {units[i]}"
