"""NetShield AI - Pydantic Schemas: Common Types."""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standardized API response envelope."""
    success: bool = True
    data: Optional[T] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class APIErrorDetail(BaseModel):
    """Error detail entry."""
    field: Optional[str] = None
    message: str


class APIErrorResponse(BaseModel):
    """Standardized error response."""
    success: bool = False
    error: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PaginationParams(BaseModel):
    """Pagination query parameters."""
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response with metadata."""
    success: bool = True
    data: List[T]
    meta: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def create(cls, items: List[T], total: int, page: int, per_page: int):
        return cls(
            data=items,
            meta={
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            },
        )


class MessageResponse(BaseModel):
    """Simple message response."""
    success: bool = True
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
