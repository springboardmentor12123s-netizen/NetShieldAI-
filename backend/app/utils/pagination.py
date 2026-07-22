"""NetShield AI - Shared Pagination Utility Helpers."""

from typing import Dict, Any, TypeVar

T = TypeVar("T")


def get_pagination_metadata(total_items: int, page: int, per_page: int) -> Dict[str, Any]:
    """Calculate pagination metadata dictionary for API envelopes."""
    total_pages = (total_items + per_page - 1) // per_page if per_page > 0 else 0
    return {
        "page": page,
        "per_page": per_page,
        "total": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
