"""NetShield AI - Centralized Logging Configuration."""

import logging
import os
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger

from app.core.config import get_settings

settings = get_settings()

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logging")
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
JSON_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"
MAX_BYTES = 50 * 1024 * 1024  # 50MB
BACKUP_COUNT = 10


def _create_file_handler(filename: str, level: int = logging.INFO) -> RotatingFileHandler:
    """Create a rotating file handler."""
    filepath = os.path.join(LOG_DIR, filename)
    handler = RotatingFileHandler(
        filepath,
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    handler.setLevel(level)

    if settings.APP_ENV == "production":
        formatter = jsonlogger.JsonFormatter(JSON_FORMAT)
    else:
        formatter = logging.Formatter(LOG_FORMAT)

    handler.setFormatter(formatter)
    return handler


def _create_console_handler() -> logging.StreamHandler:
    """Create a console handler for development."""
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG if settings.APP_DEBUG else logging.INFO)
    handler.setFormatter(logging.Formatter(LOG_FORMAT))
    return handler


def setup_logging() -> None:
    """Configure all application loggers."""
    loggers_config = {
        "app": ("application.log", logging.INFO),
        "app.security": ("security.log", logging.INFO),
        "app.audit": ("audit.log", logging.INFO),
        "app.traffic": ("traffic.log", logging.INFO),
        "app.error": ("errors.log", logging.ERROR),
    }

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Clear any existing handlers
    root_logger.handlers.clear()

    # Add console handler in development
    if settings.APP_ENV != "production":
        root_logger.addHandler(_create_console_handler())

    # Configure each logger
    for logger_name, (filename, level) in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
        logger.addHandler(_create_file_handler(filename, level))
        logger.propagate = True

    # Reduce noise from third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.APP_DEBUG else logging.WARNING
    )


def get_logger(name: str) -> logging.Logger:
    """Get a named logger."""
    return logging.getLogger(name)
