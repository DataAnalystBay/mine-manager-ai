from __future__ import annotations

import copy
import os
import shutil
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from sqlalchemy import text
from sqlalchemy.engine import Connection
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


# ============================================================
# Application configuration
# ============================================================

APP_VERSION = os.getenv(
    "APP_VERSION",
    "1.0.0",
)

ENVIRONMENT = os.getenv(
    "APP_ENV",
    "development",
)


# ============================================================
# Database performance thresholds
# ============================================================

DATABASE_HEALTHY_THRESHOLD_MS = 300
DATABASE_WARNING_THRESHOLD_MS = 1000


# ============================================================
# Overall health-check performance thresholds
# ============================================================

HEALTH_CHECK_HEALTHY_THRESHOLD_MS = 1000
HEALTH_CHECK_WARNING_THRESHOLD_MS = 3000


# ============================================================
# System Health cache configuration
# ============================================================

SYSTEM_HEALTH_CACHE_TTL_SECONDS = max(
    0,
    int(
        os.getenv(
            "SYSTEM_HEALTH_CACHE_TTL_SECONDS",
            "30",
        )
    ),
)

_system_health_cache_lock = threading.Lock()

_system_health_cache_payload: dict[
    str,
    Any,
] | None = None

_system_health_cache_created_at: float | None = None


# ============================================================
# Demo-data configuration
# ============================================================

DEMO_DATA_TABLES = [
    "production_daily",
    "fleet_daily",
    "safety_daily",
]


# ============================================================
# Shared helpers
# ============================================================

def utc_now_iso() -> str:
    """
    Return the current UTC timestamp in ISO 8601 format.
    """

    return datetime.now(
        timezone.utc
    ).isoformat()


def elapsed_ms(
    started_at: float,
) -> float:
    """
    Return elapsed time in milliseconds.
    """

    return round(
        (
            time.perf_counter()
            - started_at
        )
        * 1000,
        2,
    )


def classify_database_latency(
    latency_ms: float,
) -> dict[str, str]:
    """
    Classify database response latency.

    healthy:
        below 300 ms

    warning:
        300 ms through 1000 ms

    unhealthy:
        above 1000 ms
    """

    if (
        latency_ms
        < DATABASE_HEALTHY_THRESHOLD_MS
    ):
        return {
            "status": "healthy",
            "message": "Connected",
        }

    if (
        latency_ms
        <= DATABASE_WARNING_THRESHOLD_MS
    ):
        return {
            "status": "warning",
            "message": (
                "High database response time"
            ),
        }

    return {
        "status": "unhealthy",
        "message": (
            "Database response is too slow"
        ),
    }


def classify_check_duration(
    duration_ms: float,
) -> dict[str, str]:
    """
    Classify total system-health check duration.

    healthy:
        below 1000 ms

    warning:
        1000 ms through 3000 ms

    unhealthy:
        above 3000 ms
    """

    if (
        duration_ms
        < HEALTH_CHECK_HEALTHY_THRESHOLD_MS
    ):
        return {
            "status": "healthy",
            "message": (
                "Health check completed quickly"
            ),
        }

    if (
        duration_ms
        <= HEALTH_CHECK_WARNING_THRESHOLD_MS
    ):
        return {
            "status": "warning",
            "message": (
                "Health check response is slower "
                "than expected"
            ),
        }

    return {
        "status": "unhealthy",
        "message": (
            "Health check response is critically slow"
        ),
    }


def run_timed_check(
    check_function: Callable[
        [],
        dict[str, Any],
    ],
) -> dict[str, Any]:
    """
    Run one independent health check and attach its duration.

    Unexpected exceptions are converted into an unhealthy
    service result so one failed check does not crash the
    entire System Health endpoint.
    """

    started_at = time.perf_counter()

    try:
        result = check_function()

    except Exception as exc:
        function_name = getattr(
            check_function,
            "__name__",
            "unknown_check",
        )

        return {
            "service": function_name,
            "label": "Unknown Service",
            "status": "unhealthy",
            "message": (
                "Health check failed unexpectedly"
            ),
            "error": str(exc),
            "check_duration_ms": (
                elapsed_ms(started_at)
            ),
        }

    return {
        **result,
        "check_duration_ms": (
            elapsed_ms(started_at)
        ),
    }


# ============================================================
# Database and Demo Data health
# ============================================================

def _empty_demo_table_counts() -> dict[str, int]:
    """
    Return the default table availability map.
    """

    return {
        table_name: 0
        for table_name in DEMO_DATA_TABLES
    }


def _check_demo_data_with_connection(
    connection: Connection,
) -> dict[str, Any]:
    """
    Check Demo Data availability using an existing connection.

    All Demo Data tables are checked in one PostgreSQL query.
    This avoids opening another connection and avoids multiple
    remote database round trips.
    """

    started_at = time.perf_counter()

    table_counts = (
        _empty_demo_table_counts()
    )

    combined_query = text(
        """
        SELECT
            EXISTS(
                SELECT 1
                FROM production_daily
                LIMIT 1
            ) AS production_daily,

            EXISTS(
                SELECT 1
                FROM fleet_daily
                LIMIT 1
            ) AS fleet_daily,

            EXISTS(
                SELECT 1
                FROM safety_daily
                LIMIT 1
            ) AS safety_daily
        """
    )

    try:
        result = (
            connection.execute(
                combined_query
            )
            .mappings()
            .one()
        )

        table_counts = {
            "production_daily": (
                1
                if result["production_daily"]
                else 0
            ),
            "fleet_daily": (
                1
                if result["fleet_daily"]
                else 0
            ),
            "safety_daily": (
                1
                if result["safety_daily"]
                else 0
            ),
        }

        available_tables = sum(
            table_counts.values()
        )

        if available_tables == len(
            DEMO_DATA_TABLES
        ):
            service_status = "healthy"
            message = "Loaded"

        elif available_tables > 0:
            service_status = "warning"
            message = (
                "Demo data is partially loaded"
            )

        else:
            service_status = "warning"
            message = (
                "No demo data detected"
            )

        return {
            "service": "demo_data",
            "label": "Demo Data",
            "status": service_status,
            "message": message,
            "tables_with_data": (
                available_tables
            ),
            "total_candidate_tables": len(
                DEMO_DATA_TABLES
            ),
            "table_counts": table_counts,
            "count_mode": (
                "shared_connection_existence_check"
            ),
            "check_duration_ms": (
                elapsed_ms(started_at)
            ),
        }

    except SQLAlchemyError as exc:
        return {
            "service": "demo_data",
            "label": "Demo Data",
            "status": "warning",
            "message": (
                "Unable to verify demo data"
            ),
            "tables_with_data": 0,
            "total_candidate_tables": len(
                DEMO_DATA_TABLES
            ),
            "table_counts": table_counts,
            "count_mode": (
                "shared_connection_existence_check"
            ),
            "check_duration_ms": (
                elapsed_ms(started_at)
            ),
            "error": str(exc),
        }

    except Exception as exc:
        return {
            "service": "demo_data",
            "label": "Demo Data",
            "status": "warning",
            "message": (
                "Unexpected demo data check error"
            ),
            "tables_with_data": 0,
            "total_candidate_tables": len(
                DEMO_DATA_TABLES
            ),
            "table_counts": table_counts,
            "count_mode": (
                "shared_connection_existence_check"
            ),
            "check_duration_ms": (
                elapsed_ms(started_at)
            ),
            "error": str(exc),
        }


def check_database_and_demo_data() -> list[
    dict[str, Any]
]:
    """
    Check database connectivity and Demo Data availability
    using one shared PostgreSQL connection.

    Returns:
        A two-item list containing:
            1. Database service result
            2. Demo Data service result
    """

    overall_started_at = (
        time.perf_counter()
    )

    empty_table_counts = (
        _empty_demo_table_counts()
    )

    try:
        with engine.connect() as connection:
            database_started_at = (
                time.perf_counter()
            )

            connection.execute(
                text("SELECT 1")
            )

            database_duration_ms = (
                elapsed_ms(
                    database_started_at
                )
            )

            database_health = (
                classify_database_latency(
                    database_duration_ms
                )
            )

            database_result = {
                "service": "database",
                "label": "Database",
                "status": (
                    database_health["status"]
                ),
                "message": (
                    database_health["message"]
                ),
                "latency_ms": (
                    database_duration_ms
                ),
                "healthy_threshold_ms": (
                    DATABASE_HEALTHY_THRESHOLD_MS
                ),
                "warning_threshold_ms": (
                    DATABASE_WARNING_THRESHOLD_MS
                ),
                "check_duration_ms": (
                    database_duration_ms
                ),
            }

            demo_data_result = (
                _check_demo_data_with_connection(
                    connection
                )
            )

            return [
                database_result,
                demo_data_result,
            ]

    except SQLAlchemyError as exc:
        total_duration_ms = elapsed_ms(
            overall_started_at
        )

        return [
            {
                "service": "database",
                "label": "Database",
                "status": "unhealthy",
                "message": "Connection failed",
                "latency_ms": None,
                "healthy_threshold_ms": (
                    DATABASE_HEALTHY_THRESHOLD_MS
                ),
                "warning_threshold_ms": (
                    DATABASE_WARNING_THRESHOLD_MS
                ),
                "check_duration_ms": (
                    total_duration_ms
                ),
                "error": str(exc),
            },
            {
                "service": "demo_data",
                "label": "Demo Data",
                "status": "warning",
                "message": (
                    "Unable to verify demo data"
                ),
                "tables_with_data": 0,
                "total_candidate_tables": len(
                    DEMO_DATA_TABLES
                ),
                "table_counts": (
                    empty_table_counts
                ),
                "count_mode": (
                    "shared_connection_existence_check"
                ),
                "check_duration_ms": 0,
                "error": (
                    "Database connection unavailable"
                ),
            },
        ]

    except Exception as exc:
        total_duration_ms = elapsed_ms(
            overall_started_at
        )

        return [
            {
                "service": "database",
                "label": "Database",
                "status": "unhealthy",
                "message": (
                    "Unexpected database error"
                ),
                "latency_ms": None,
                "healthy_threshold_ms": (
                    DATABASE_HEALTHY_THRESHOLD_MS
                ),
                "warning_threshold_ms": (
                    DATABASE_WARNING_THRESHOLD_MS
                ),
                "check_duration_ms": (
                    total_duration_ms
                ),
                "error": str(exc),
            },
            {
                "service": "demo_data",
                "label": "Demo Data",
                "status": "warning",
                "message": (
                    "Unable to verify demo data"
                ),
                "tables_with_data": 0,
                "total_candidate_tables": len(
                    DEMO_DATA_TABLES
                ),
                "table_counts": (
                    empty_table_counts
                ),
                "count_mode": (
                    "shared_connection_existence_check"
                ),
                "check_duration_ms": 0,
                "error": str(exc),
            },
        ]


# ============================================================
# Backend API health
# ============================================================

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


# ============================================================
# AI service health
# ============================================================

def check_ai_service() -> dict[str, Any]:
    """
    Check whether AI service configuration is available.

    This check does not send a paid request to OpenAI or
    Azure OpenAI.
    """

    azure_key = os.getenv(
        "AZURE_OPENAI_API_KEY"
    )

    openai_key = os.getenv(
        "OPENAI_API_KEY"
    )

    if azure_key:
        return {
            "service": "ai_service",
            "label": "AI Service",
            "status": "healthy",
            "message": "Configured",
            "provider": "Azure OpenAI",
        }

    if openai_key:
        return {
            "service": "ai_service",
            "label": "AI Service",
            "status": "healthy",
            "message": "Configured",
            "provider": "OpenAI",
        }

    return {
        "service": "ai_service",
        "label": "AI Service",
        "status": "warning",
        "message": (
            "API key not configured"
        ),
        "provider": "Not configured",
    }


# ============================================================
# Storage health
# ============================================================

def check_storage() -> dict[str, Any]:
    """
    Verify that the application storage directory exists,
    is writable, and has sufficient free space.
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

        test_file = (
            storage_path
            / ".health_check"
        )

        test_file.write_text(
            (
                "Mine Manager AI storage "
                "health check"
            ),
            encoding="utf-8",
        )

        test_file.unlink(
            missing_ok=True
        )

        disk_usage = shutil.disk_usage(
            storage_path
        )

        free_space_gb = round(
            disk_usage.free
            / (1024**3),
            2,
        )

        used_space_gb = round(
            disk_usage.used
            / (1024**3),
            2,
        )

        total_space_gb = round(
            disk_usage.total
            / (1024**3),
            2,
        )

        free_space_percent = round(
            (
                disk_usage.free
                / disk_usage.total
            )
            * 100,
            2,
        )

        if free_space_percent < 5:
            storage_status = "unhealthy"
            storage_message = (
                "Critically low storage space"
            )

        elif free_space_percent < 15:
            storage_status = "warning"
            storage_message = (
                "Low storage space"
            )

        else:
            storage_status = "healthy"
            storage_message = "Ready"

        return {
            "service": "storage",
            "label": "Storage",
            "status": storage_status,
            "message": storage_message,
            "path": str(storage_path),
            "free_space_gb": (
                free_space_gb
            ),
            "used_space_gb": (
                used_space_gb
            ),
            "total_space_gb": (
                total_space_gb
            ),
            "free_space_percent": (
                free_space_percent
            ),
        }

    except Exception as exc:
        return {
            "service": "storage",
            "label": "Storage",
            "status": "unhealthy",
            "message": (
                "Storage unavailable"
            ),
            "path": str(storage_path),
            "error": str(exc),
        }


# ============================================================
# Overall health helpers
# ============================================================

def determine_overall_status(
    services: list[dict[str, Any]],
) -> str:
    """
    Determine overall application health from service statuses.
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


def build_service_summary(
    services: list[dict[str, Any]],
) -> dict[str, int]:
    """
    Count services by health status.
    """

    return {
        "total": len(services),
        "healthy": sum(
            1
            for service in services
            if service.get("status")
            == "healthy"
        ),
        "warning": sum(
            1
            for service in services
            if service.get("status")
            == "warning"
        ),
        "unhealthy": sum(
            1
            for service in services
            if service.get("status")
            == "unhealthy"
        ),
    }


def find_slowest_service(
    services: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Return summary information for the slowest service check.
    """

    if not services:
        return {
            "service": None,
            "label": None,
            "check_duration_ms": None,
        }

    slowest_service = max(
        services,
        key=lambda service: (
            service.get(
                "check_duration_ms",
                0,
            )
            or 0
        ),
    )

    return {
        "service": slowest_service.get(
            "service"
        ),
        "label": slowest_service.get(
            "label"
        ),
        "check_duration_ms": (
            slowest_service.get(
                "check_duration_ms"
            )
        ),
    }


# ============================================================
# Uncached health-check execution
# ============================================================

def _run_system_health_checks() -> dict[str, Any]:
    """
    Perform a real, uncached System Health check.
    """

    started_at = time.perf_counter()

    database_services = (
        check_database_and_demo_data()
    )

    database_result = (
        database_services[0]
    )

    demo_data_result = (
        database_services[1]
    )

    services = [
        database_result,
        run_timed_check(
            check_backend_api
        ),
        run_timed_check(
            check_ai_service
        ),
        run_timed_check(
            check_storage
        ),
        demo_data_result,
    ]

    duration_ms = elapsed_ms(
        started_at
    )

    duration_health = (
        classify_check_duration(
            duration_ms
        )
    )

    overall_status = (
        determine_overall_status(
            services
        )
    )

    service_summary = (
        build_service_summary(
            services
        )
    )

    slowest_service = (
        find_slowest_service(
            services
        )
    )

    return {
        "application": (
            "Mine Manager AI"
        ),
        "overall_status": (
            overall_status
        ),
        "checked_at": utc_now_iso(),
        "check_duration_ms": (
            duration_ms
        ),
        "check_duration_status": (
            duration_health["status"]
        ),
        "check_duration_message": (
            duration_health["message"]
        ),
        "check_duration_thresholds": {
            "healthy_below_ms": (
                HEALTH_CHECK_HEALTHY_THRESHOLD_MS
            ),
            "warning_up_to_ms": (
                HEALTH_CHECK_WARNING_THRESHOLD_MS
            ),
        },
        "slowest_service": (
            slowest_service
        ),
        "version": APP_VERSION,
        "environment": ENVIRONMENT,
        "service_summary": (
            service_summary
        ),
        "services": services,
    }


# ============================================================
# Cache helpers
# ============================================================

def clear_system_health_cache() -> None:
    """
    Clear the in-memory System Health cache.

    This helper may later be used by an administrator-only
    force-refresh endpoint.
    """

    global _system_health_cache_payload
    global _system_health_cache_created_at

    with _system_health_cache_lock:
        _system_health_cache_payload = None
        _system_health_cache_created_at = None


def _get_valid_cached_payload() -> tuple[
    dict[str, Any] | None,
    float,
]:
    """
    Return the cached payload and its age when still valid.

    The caller must hold _system_health_cache_lock.
    """

    if (
        SYSTEM_HEALTH_CACHE_TTL_SECONDS <= 0
        or _system_health_cache_payload is None
        or _system_health_cache_created_at is None
    ):
        return None, 0.0

    cache_age_seconds = (
        time.monotonic()
        - _system_health_cache_created_at
    )

    if (
        cache_age_seconds
        >= SYSTEM_HEALTH_CACHE_TTL_SECONDS
    ):
        return None, cache_age_seconds

    return (
        copy.deepcopy(
            _system_health_cache_payload
        ),
        cache_age_seconds,
    )


def _decorate_health_response(
    payload: dict[str, Any],
    *,
    cached: bool,
    cache_age_seconds: float,
    request_started_at: float,
) -> dict[str, Any]:
    """
    Add cache and API-response metadata without mutating
    the stored cache object.
    """

    response = copy.deepcopy(payload)

    response["cached"] = cached

    response["cache_age_seconds"] = round(
        max(cache_age_seconds, 0),
        2,
    )

    response["cache_ttl_seconds"] = (
        SYSTEM_HEALTH_CACHE_TTL_SECONDS
    )

    response["response_duration_ms"] = (
        elapsed_ms(request_started_at)
    )

    return response


# ============================================================
# Main System Health response
# ============================================================

def get_system_health(
    force_refresh: bool = False,
) -> dict[str, Any]:
    """
    Return Mine Manager AI System Health information.

    Normal behavior:
        - A real health check is performed when no valid cache
          exists.
        - The result is cached for 30 seconds by default.
        - Requests during the cache window return immediately.

    Args:
        force_refresh:
            Ignore the current cached result and run a new
            health check.

    The default cache lifetime can be changed through:

        SYSTEM_HEALTH_CACHE_TTL_SECONDS=30
    """

    global _system_health_cache_payload
    global _system_health_cache_created_at

    request_started_at = (
        time.perf_counter()
    )

    if not force_refresh:
        with _system_health_cache_lock:
            (
                cached_payload,
                cache_age_seconds,
            ) = _get_valid_cached_payload()

            if cached_payload is not None:
                return (
                    _decorate_health_response(
                        cached_payload,
                        cached=True,
                        cache_age_seconds=(
                            cache_age_seconds
                        ),
                        request_started_at=(
                            request_started_at
                        ),
                    )
                )

    # The lock prevents several simultaneous requests from
    # executing the expensive remote database check together.
    with _system_health_cache_lock:
        if not force_refresh:
            (
                cached_payload,
                cache_age_seconds,
            ) = _get_valid_cached_payload()

            if cached_payload is not None:
                return (
                    _decorate_health_response(
                        cached_payload,
                        cached=True,
                        cache_age_seconds=(
                            cache_age_seconds
                        ),
                        request_started_at=(
                            request_started_at
                        ),
                    )
                )

        fresh_payload = (
            _run_system_health_checks()
        )

        _system_health_cache_payload = (
            copy.deepcopy(
                fresh_payload
            )
        )

        _system_health_cache_created_at = (
            time.monotonic()
        )

    return _decorate_health_response(
        fresh_payload,
        cached=False,
        cache_age_seconds=0,
        request_started_at=(
            request_started_at
        ),
    )