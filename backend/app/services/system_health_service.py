from __future__ import annotations

import os
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
ENVIRONMENT = os.getenv("APP_ENV", "development")


def utc_now_iso() -> str:
    """
    Return the current UTC timestamp in ISO 8601 format.
    """

    return datetime.now(timezone.utc).isoformat()


def check_database() -> dict[str, Any]:
    """
    Verify that PostgreSQL is reachable and measure query latency.
    """

    started_at = time.perf_counter()

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        latency_ms = round(
            (time.perf_counter() - started_at) * 1000,
            2,
        )

        return {
            "service": "database",
            "label": "Database",
            "status": "healthy",
            "message": "Connected",
            "latency_ms": latency_ms,
        }

    except SQLAlchemyError as exc:
        return {
            "service": "database",
            "label": "Database",
            "status": "unhealthy",
            "message": "Connection failed",
            "latency_ms": None,
            "error": str(exc),
        }

    except Exception as exc:
        return {
            "service": "database",
            "label": "Database",
            "status": "unhealthy",
            "message": "Unexpected database error",
            "latency_ms": None,
            "error": str(exc),
        }


def check_backend_api() -> dict[str, Any]:
    """
    Return the running backend application status.
    """

    return {
        "service": "backend_api",
        "label": "Backend API",
        "status": "healthy",
        "message": "Running",
        "version": APP_VERSION,
        "environment": ENVIRONMENT,
    }


def check_storage() -> dict[str, Any]:
    """
    Verify that the configured application storage directory exists
    and is writable.
    """

    storage_path = Path(
        os.getenv(
            "STORAGE_PATH",
            "app/storage",
        )
    )

    try:
        storage_path.mkdir(
            parents=True,
            exist_ok=True,
        )

        test_file = storage_path / ".health_check"

        test_file.write_text(
            "Mine Manager AI storage health check",
            encoding="utf-8",
        )

        test_file.unlink(missing_ok=True)

        disk_usage = shutil.disk_usage(storage_path)

        free_space_gb = round(
            disk_usage.free / (1024**3),
            2,
        )

        total_space_gb = round(
            disk_usage.total / (1024**3),
            2,
        )

        return {
            "service": "storage",
            "label": "Storage",
            "status": "healthy",
            "message": "Ready",
            "path": str(storage_path),
            "free_space_gb": free_space_gb,
            "total_space_gb": total_space_gb,
        }

    except Exception as exc:
        return {
            "service": "storage",
            "label": "Storage",
            "status": "unhealthy",
            "message": "Storage unavailable",
            "path": str(storage_path),
            "error": str(exc),
        }


def check_ai_service() -> dict[str, Any]:
    """
    Check whether the AI service has the required configuration.

    This first version checks configuration availability only.
    It does not send a paid request to the AI provider.
    """

    api_key = (
        os.getenv("OPENAI_API_KEY")
        or os.getenv("AZURE_OPENAI_API_KEY")
    )

    provider = "Not configured"

    if os.getenv("AZURE_OPENAI_API_KEY"):
        provider = "Azure OpenAI"
    elif os.getenv("OPENAI_API_KEY"):
        provider = "OpenAI"

    if api_key:
        return {
            "service": "ai_service",
            "label": "AI Service",
            "status": "healthy",
            "message": "Configured",
            "provider": provider,
        }

    return {
        "service": "ai_service",
        "label": "AI Service",
        "status": "warning",
        "message": "API key not configured",
        "provider": provider,
    }


def check_demo_data() -> dict[str, Any]:
    """
    Check whether operational demo data appears to be available.

    This uses a lightweight table-count check. Missing tables are
    reported as a warning rather than crashing the health endpoint.
    """

    candidate_tables = [
        "production_daily",
        "fleet_daily",
        "safety_daily",
    ]

    table_counts: dict[str, int] = {}
    available_tables = 0

    try:
        with engine.connect() as connection:
            for table_name in candidate_tables:
                try:
                    query = text(
                        f"SELECT COUNT(*) FROM {table_name}"
                    )

                    count = connection.execute(query).scalar() or 0
                    table_counts[table_name] = int(count)

                    if count > 0:
                        available_tables += 1

                except Exception:
                    table_counts[table_name] = 0

        if available_tables > 0:
            return {
                "service": "demo_data",
                "label": "Demo Data",
                "status": "healthy",
                "message": "Loaded",
                "tables_with_data": available_tables,
                "table_counts": table_counts,
            }

        return {
            "service": "demo_data",
            "label": "Demo Data",
            "status": "warning",
            "message": "No demo data detected",
            "tables_with_data": 0,
            "table_counts": table_counts,
        }

    except Exception as exc:
        return {
            "service": "demo_data",
            "label": "Demo Data",
            "status": "warning",
            "message": "Unable to verify demo data",
            "table_counts": table_counts,
            "error": str(exc),
        }


def determine_overall_status(
    services: list[dict[str, Any]],
) -> str:
    """
    Calculate the overall application health.

    unhealthy:
        At least one critical service is unavailable.

    warning:
        No critical failure, but one or more optional services
        require attention.

    healthy:
        All services are operating normally.
    """

    statuses = {
        service.get("status")
        for service in services
    }

    if "unhealthy" in statuses:
        return "unhealthy"

    if "warning" in statuses:
        return "warning"

    return "healthy"


def get_system_health() -> dict[str, Any]:
    """
    Run all system health checks and return one response object.
    """

    started_at = time.perf_counter()

    services = [
        check_database(),
        check_backend_api(),
        check_ai_service(),
        check_storage(),
        check_demo_data(),
    ]

    overall_status = determine_overall_status(services)

    duration_ms = round(
        (time.perf_counter() - started_at) * 1000,
        2,
    )

    return {
        "application": "Mine Manager AI",
        "overall_status": overall_status,
        "checked_at": utc_now_iso(),
        "check_duration_ms": duration_ms,
        "version": APP_VERSION,
        "environment": ENVIRONMENT,
        "services": services,
    }