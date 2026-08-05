from __future__ import annotations

import importlib.metadata
import os
import platform
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text

from app.database import engine


# ============================================================
# Application constants
# ============================================================

APPLICATION_NAME = "Mine Manager AI"
DEFAULT_APPLICATION_VERSION = "1.0.0"

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_ROOT.parent

LOG_DIRECTORY = Path(
    os.getenv(
        "LOG_DIR",
        str(BACKEND_ROOT / "logs"),
    )
)

UPLOAD_DIRECTORY = Path(
    os.getenv(
        "UPLOAD_DIR",
        str(BACKEND_ROOT / "uploads"),
    )
)

STATIC_DIRECTORY = BACKEND_ROOT / "app" / "static"
LOGO_DIRECTORY = STATIC_DIRECTORY / "logos"

MAX_RECENT_LOG_ENTRIES = 25
MAX_LOG_LINE_LENGTH = 1000

SENSITIVE_TERMS = (
    "password",
    "passwd",
    "secret",
    "secret_key",
    "jwt",
    "token",
    "authorization",
    "api_key",
    "apikey",
    "db_password",
    "openai_api_key",
    "azure_openai_api_key",
    "connection_string",
)


# ============================================================
# General helpers
# ============================================================


def utc_now_iso() -> str:
    """
    Return the current UTC timestamp in ISO 8601 format.
    """

    return datetime.now(timezone.utc).isoformat()


def elapsed_ms(started_at: float) -> float:
    """
    Return elapsed milliseconds rounded to two decimals.
    """

    return round(
        (time.perf_counter() - started_at) * 1000,
        2,
    )


def parse_boolean(
    value: str | None,
    default: bool = False,
) -> bool:
    """
    Convert a typical environment-variable value to bool.
    """

    if value is None:
        return default

    return value.strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
        "enabled",
    }


def safe_environment_name() -> str:
    """
    Return the configured application environment without
    exposing sensitive values.
    """

    return (
        os.getenv("APP_ENV")
        or os.getenv("ENVIRONMENT")
        or os.getenv("FASTAPI_ENV")
        or "development"
    )


def safe_application_version() -> str:
    """
    Return the configured application version.
    """

    return (
        os.getenv("APP_VERSION")
        or DEFAULT_APPLICATION_VERSION
    )


def get_package_version(package_name: str) -> str | None:
    """
    Safely retrieve an installed package version.
    """

    try:
        return importlib.metadata.version(package_name)
    except importlib.metadata.PackageNotFoundError:
        return None
    except Exception:
        return None


def sanitize_text(value: Any) -> str:
    """
    Mask lines that may contain passwords, tokens, secrets,
    credentials, or authorization headers.

    This function intentionally prefers removing too much
    information rather than exposing a secret.
    """

    if value is None:
        return ""

    text_value = str(value)
    lowered = text_value.lower()

    if any(term in lowered for term in SENSITIVE_TERMS):
        return "[REDACTED SENSITIVE VALUE]"

    if len(text_value) > MAX_LOG_LINE_LENGTH:
        return (
            text_value[:MAX_LOG_LINE_LENGTH]
            + "... [TRUNCATED]"
        )

    return text_value


def build_status(
    *,
    status: str,
    message: str,
    response_time_ms: float | None = None,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Create a consistent diagnostics component result.
    """

    payload: dict[str, Any] = {
        "status": status,
        "message": message,
        "checked_at": utc_now_iso(),
    }

    if response_time_ms is not None:
        payload["response_time_ms"] = response_time_ms

    if details is not None:
        payload["details"] = details

    return payload


# ============================================================
# Application and runtime information
# ============================================================


def get_application_information() -> dict[str, Any]:
    """
    Return safe application and runtime metadata.
    """

    return {
        "application": APPLICATION_NAME,
        "version": safe_application_version(),
        "environment": safe_environment_name(),
        "debug_enabled": parse_boolean(
            os.getenv("DEBUG")
            or os.getenv("APP_DEBUG")
            or os.getenv("FASTAPI_DEBUG"),
            default=False,
        ),
        "server_time_utc": utc_now_iso(),
        "platform": platform.platform(),
        "operating_system": platform.system(),
        "operating_system_release": platform.release(),
        "machine": platform.machine(),
        "python_version": platform.python_version(),
        "python_executable": str(Path(sys.executable).name),
        "process_id": os.getpid(),
    }


def get_dependency_information() -> dict[str, Any]:
    """
    Return the versions of important application dependencies.
    """

    dependency_names = {
        "fastapi": "fastapi",
        "starlette": "starlette",
        "uvicorn": "uvicorn",
        "sqlalchemy": "SQLAlchemy",
        "psycopg2": "psycopg2-binary",
        "pydantic": "pydantic",
        "alembic": "alembic",
        "openai": "openai",
        "pandas": "pandas",
        "openpyxl": "openpyxl",
        "reportlab": "reportlab",
    }

    versions: dict[str, str | None] = {}

    for display_name, package_name in dependency_names.items():
        versions[display_name] = get_package_version(
            package_name
        )

    return {
        "status": "available",
        "packages": versions,
    }


# ============================================================
# Database diagnostics
# ============================================================


def check_database() -> dict[str, Any]:
    """
    Check database connectivity and retrieve safe metadata.

    Passwords, connection strings, and database credentials
    are never returned.
    """

    started_at = time.perf_counter()

    try:
        with engine.connect() as connection:
            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar()

            current_user = connection.execute(
                text("SELECT current_user")
            ).scalar()

            server_version = connection.execute(
                text("SHOW server_version")
            ).scalar()

            connection_test = connection.execute(
                text("SELECT 1")
            ).scalar()

            alembic_revision = None

            try:
                alembic_revision = connection.execute(
                    text(
                        "SELECT version_num "
                        "FROM alembic_version "
                        "LIMIT 1"
                    )
                ).scalar()
            except Exception:
                alembic_revision = None

        return build_status(
            status="healthy",
            message="Database connection is operational.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "database_name": database_name,
                "database_user": current_user,
                "server_version": server_version,
                "connection_test": connection_test,
                "alembic_revision": alembic_revision,
                "ssl_expected": True,
            },
        )

    except Exception as exc:
        return build_status(
            status="failed",
            message="Database connection check failed.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "error_type": type(exc).__name__,
                "error": sanitize_text(exc),
            },
        )


# ============================================================
# Directory and storage diagnostics
# ============================================================


def check_directory(
    name: str,
    directory: Path,
) -> dict[str, Any]:
    """
    Check whether a directory exists and is writable.
    """

    started_at = time.perf_counter()

    try:
        exists = directory.exists()
        is_directory = directory.is_dir() if exists else False

        writable = False

        if exists and is_directory:
            writable = os.access(directory, os.W_OK)

        status = (
            "healthy"
            if exists and is_directory and writable
            else "warning"
        )

        if not exists:
            message = f"{name} directory does not exist."
        elif not is_directory:
            message = f"{name} path is not a directory."
        elif not writable:
            message = f"{name} directory is not writable."
        else:
            message = f"{name} directory is available."

        return build_status(
            status=status,
            message=message,
            response_time_ms=elapsed_ms(started_at),
            details={
                "name": name,
                "path": str(directory),
                "exists": exists,
                "is_directory": is_directory,
                "writable": writable,
            },
        )

    except Exception as exc:
        return build_status(
            status="failed",
            message=f"{name} directory check failed.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "name": name,
                "path": str(directory),
                "error_type": type(exc).__name__,
                "error": sanitize_text(exc),
            },
        )


def check_disk_storage() -> dict[str, Any]:
    """
    Return disk usage for the project drive.
    """

    started_at = time.perf_counter()

    try:
        usage = shutil.disk_usage(PROJECT_ROOT)

        total_gb = round(
            usage.total / (1024**3),
            2,
        )

        used_gb = round(
            usage.used / (1024**3),
            2,
        )

        free_gb = round(
            usage.free / (1024**3),
            2,
        )

        free_percent = round(
            (
                usage.free
                / usage.total
                * 100
            )
            if usage.total
            else 0,
            2,
        )

        if free_percent < 5:
            status = "failed"
            message = "Critical disk-space shortage."
        elif free_percent < 15:
            status = "warning"
            message = "Available disk space is low."
        else:
            status = "healthy"
            message = "Disk storage is available."

        return build_status(
            status=status,
            message=message,
            response_time_ms=elapsed_ms(started_at),
            details={
                "path": str(PROJECT_ROOT),
                "total_gb": total_gb,
                "used_gb": used_gb,
                "free_gb": free_gb,
                "free_percent": free_percent,
            },
        )

    except Exception as exc:
        return build_status(
            status="failed",
            message="Disk-storage check failed.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "error_type": type(exc).__name__,
                "error": sanitize_text(exc),
            },
        )


def get_directory_diagnostics() -> list[dict[str, Any]]:
    """
    Return checks for application runtime directories.
    """

    return [
        check_directory(
            "Log",
            LOG_DIRECTORY,
        ),
        check_directory(
            "Upload",
            UPLOAD_DIRECTORY,
        ),
        check_directory(
            "Static",
            STATIC_DIRECTORY,
        ),
        check_directory(
            "Logo",
            LOGO_DIRECTORY,
        ),
    ]


# ============================================================
# Log diagnostics
# ============================================================


def discover_log_files() -> list[Path]:
    """
    Find supported log files in the configured log directory.
    """

    if not LOG_DIRECTORY.exists():
        return []

    log_files: list[Path] = []

    supported_patterns = (
        "*.log",
        "*.txt",
        "*.jsonl",
    )

    for pattern in supported_patterns:
        log_files.extend(
            path
            for path in LOG_DIRECTORY.glob(pattern)
            if path.is_file()
        )

    return sorted(
        set(log_files),
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )


def read_recent_log_entries(
    maximum_entries: int = MAX_RECENT_LOG_ENTRIES,
) -> dict[str, Any]:
    """
    Return a redacted sample of recent warning and error lines.

    Only text lines containing WARNING, ERROR, CRITICAL, or
    EXCEPTION are included.
    """

    started_at = time.perf_counter()

    try:
        log_files = discover_log_files()

        entries: list[dict[str, Any]] = []

        for log_file in log_files:
            try:
                lines = log_file.read_text(
                    encoding="utf-8",
                    errors="replace",
                ).splitlines()
            except Exception:
                continue

            for line in reversed(lines):
                normalized = line.upper()

                if not any(
                    level in normalized
                    for level in (
                        "WARNING",
                        "ERROR",
                        "CRITICAL",
                        "EXCEPTION",
                    )
                ):
                    continue

                entries.append(
                    {
                        "file": log_file.name,
                        "message": sanitize_text(line),
                    }
                )

                if len(entries) >= maximum_entries:
                    break

            if len(entries) >= maximum_entries:
                break

        return build_status(
            status=(
                "available"
                if log_files
                else "not_configured"
            ),
            message=(
                "Recent application log entries were collected."
                if log_files
                else "No application log files were found."
            ),
            response_time_ms=elapsed_ms(started_at),
            details={
                "log_directory": str(LOG_DIRECTORY),
                "file_count": len(log_files),
                "entry_count": len(entries),
                "entries": entries,
            },
        )

    except Exception as exc:
        return build_status(
            status="failed",
            message="Unable to inspect application logs.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "error_type": type(exc).__name__,
                "error": sanitize_text(exc),
            },
        )


# ============================================================
# System Health integration
# ============================================================


def get_system_health_snapshot() -> dict[str, Any]:
    """
    Retrieve the existing System Health payload.

    This intentionally reuses the mature System Health service
    rather than duplicating those checks.
    """

    started_at = time.perf_counter()

    try:
        from app.services.system_health_service import (
            get_system_health,
        )

        health_payload = get_system_health(
            force_refresh=False
        )

        return build_status(
            status="available",
            message="System Health snapshot is available.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "overall_status": health_payload.get(
                    "overall_status"
                ),
                "checked_at": health_payload.get(
                    "checked_at"
                ),
                "cached": health_payload.get(
                    "cached"
                ),
                "cache_age_seconds": health_payload.get(
                    "cache_age_seconds"
                ),
                "check_duration_ms": health_payload.get(
                    "check_duration_ms"
                ),
                "response_duration_ms": health_payload.get(
                    "response_duration_ms"
                ),
                "service_summary": health_payload.get(
                    "service_summary"
                ),
                "slowest_service": health_payload.get(
                    "slowest_service"
                ),
            },
        )

    except Exception as exc:
        return build_status(
            status="failed",
            message="System Health snapshot is unavailable.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "error_type": type(exc).__name__,
                "error": sanitize_text(exc),
            },
        )


# ============================================================
# Deployment Readiness integration
# ============================================================


def get_deployment_readiness_snapshot() -> dict[str, Any]:
    """
    Retrieve a compact Deployment Readiness summary when the
    existing service is available.
    """

    started_at = time.perf_counter()

    try:
        from app.services.deployment_readiness_service import (
            get_deployment_readiness,
        )

        readiness_payload = get_deployment_readiness()

        summary = readiness_payload.get(
            "summary",
            readiness_payload,
        )

        return build_status(
            status="available",
            message="Deployment Readiness snapshot is available.",
            response_time_ms=elapsed_ms(started_at),
            details={
                "overall_status": readiness_payload.get(
                    "overall_status"
                ),
                "readiness_score": (
                    readiness_payload.get(
                        "readiness_score"
                    )
                    or summary.get(
                        "readiness_score"
                    )
                    or summary.get("score")
                ),
                "passed": (
                    summary.get("passed")
                    or summary.get("passed_count")
                ),
                "warnings": (
                    summary.get("warnings")
                    or summary.get("warning_count")
                ),
                "failed": (
                    summary.get("failed")
                    or summary.get("failed_count")
                ),
                "checked_at": readiness_payload.get(
                    "checked_at"
                ),
            },
        )

    except ImportError:
        return build_status(
            status="not_available",
            message=(
                "Deployment Readiness service is not available."
            ),
            response_time_ms=elapsed_ms(started_at),
        )

    except Exception as exc:
        return build_status(
            status="failed",
            message=(
                "Deployment Readiness snapshot is unavailable."
            ),
            response_time_ms=elapsed_ms(started_at),
            details={
                "error_type": type(exc).__name__,
                "error": sanitize_text(exc),
            },
        )


# ============================================================
# Diagnostics aggregation
# ============================================================


def determine_overall_status(
    components: list[dict[str, Any]],
) -> str:
    """
    Determine the combined diagnostics status.
    """

    statuses = {
        str(component.get("status", "")).lower()
        for component in components
    }

    if "failed" in statuses:
        return "failed"

    if "warning" in statuses:
        return "warning"

    if "not_configured" in statuses:
        return "warning"

    return "healthy"


def get_support_diagnostics() -> dict[str, Any]:
    """
    Return the complete safe Support Diagnostics payload.
    """

    started_at = time.perf_counter()

    database = check_database()
    disk_storage = check_disk_storage()
    directories = get_directory_diagnostics()
    logs = read_recent_log_entries()
    system_health = get_system_health_snapshot()
    deployment_readiness = (
        get_deployment_readiness_snapshot()
    )

    status_components = [
        database,
        disk_storage,
        *directories,
        logs,
        system_health,
        deployment_readiness,
    ]

    overall_status = determine_overall_status(
        status_components
    )

    return {
        "application": APPLICATION_NAME,
        "diagnostics_version": "1.0",
        "generated_at": utc_now_iso(),
        "overall_status": overall_status,
        "generation_duration_ms": elapsed_ms(
            started_at
        ),
        "application_information": (
            get_application_information()
        ),
        "dependencies": get_dependency_information(),
        "database": database,
        "disk_storage": disk_storage,
        "directories": directories,
        "logs": logs,
        "system_health": system_health,
        "deployment_readiness": deployment_readiness,
        "security_notice": (
            "Passwords, tokens, authorization headers, API keys, "
            "database connection strings, and uploaded customer files "
            "are excluded from this diagnostics response."
        ),
    }


def get_support_diagnostics_summary() -> dict[str, Any]:
    """
    Return a compact diagnostics summary for dashboard cards.
    """

    diagnostics = get_support_diagnostics()

    directory_statuses = [
        item.get("status")
        for item in diagnostics.get(
            "directories",
            []
        )
    ]

    return {
        "application": diagnostics.get("application"),
        "generated_at": diagnostics.get("generated_at"),
        "overall_status": diagnostics.get(
            "overall_status"
        ),
        "environment": diagnostics.get(
            "application_information",
            {},
        ).get("environment"),
        "version": diagnostics.get(
            "application_information",
            {},
        ).get("version"),
        "database_status": diagnostics.get(
            "database",
            {},
        ).get("status"),
        "storage_status": diagnostics.get(
            "disk_storage",
            {},
        ).get("status"),
        "directory_statuses": directory_statuses,
        "log_status": diagnostics.get(
            "logs",
            {},
        ).get("status"),
        "system_health_status": diagnostics.get(
            "system_health",
            {},
        ).get("status"),
        "deployment_readiness_status": diagnostics.get(
            "deployment_readiness",
            {},
        ).get("status"),
    }