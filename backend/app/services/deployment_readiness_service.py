"""
Deployment Readiness Service
============================

Evaluates whether Mine Manager AI is ready for pilot or production deployment.

The service checks:

1. Application environment
2. Security configuration
3. Database connectivity
4. Database schema availability
5. Required directories
6. Required Python packages
7. CORS configuration
8. Logging configuration
9. Demo-mode configuration
10. Overall deployment readiness score

This module does not modify the database or application configuration.
It only performs read-only checks.
"""

from __future__ import annotations

import logging
import os
import platform
import sys
from datetime import datetime, timezone
from importlib import metadata
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Project paths
# ---------------------------------------------------------------------------

SERVICE_FILE = Path(__file__).resolve()

# deployment_readiness_service.py
# └── services
#     └── app
#         └── backend
BACKEND_ROOT = SERVICE_FILE.parents[2]
APP_ROOT = BACKEND_ROOT / "app"

STATIC_ROOT = APP_ROOT / "static"
LOGS_ROOT = BACKEND_ROOT / "logs"
UPLOADS_ROOT = BACKEND_ROOT / "uploads"

REQUIRED_DIRECTORIES = {
    "application": APP_ROOT,
    "static": STATIC_ROOT,
}

OPTIONAL_DIRECTORIES = {
    "logs": LOGS_ROOT,
    "uploads": UPLOADS_ROOT,
}


# ---------------------------------------------------------------------------
# Required database tables
# ---------------------------------------------------------------------------

# These tables are based on the main Mine Manager AI Version 1.0 modules.
# A missing optional table will generate a warning rather than make the whole
# application unavailable.
REQUIRED_DATABASE_TABLES = [
    "users",
    "companies",
]

RECOMMENDED_DATABASE_TABLES = [
    "company_settings",
    "mine_settings",
    "kpi_targets",
    "alert_thresholds",
    "executive_actions",
    "production_daily",
    "fleet_daily",
    "plant_daily",
    "safety_daily",
]


# ---------------------------------------------------------------------------
# Required Python packages
# ---------------------------------------------------------------------------

REQUIRED_PACKAGES = [
    "fastapi",
    "uvicorn",
    "sqlalchemy",
    "pydantic",
]

RECOMMENDED_PACKAGES = [
    "alembic",
    "psycopg2-binary",
    "python-jose",
    "passlib",
]


# ---------------------------------------------------------------------------
# Status constants
# ---------------------------------------------------------------------------

STATUS_PASS = "pass"
STATUS_WARNING = "warning"
STATUS_FAIL = "fail"


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _utc_now_iso() -> str:
    """Return the current UTC date and time as an ISO string."""
    return datetime.now(timezone.utc).isoformat()


def _normalise_boolean(value: Optional[str]) -> Optional[bool]:
    """
    Convert an environment-variable string into a Boolean.

    Returns None when the supplied value cannot be interpreted.
    """
    if value is None:
        return None

    normalised = value.strip().lower()

    if normalised in {"true", "1", "yes", "on", "enabled"}:
        return True

    if normalised in {"false", "0", "no", "off", "disabled"}:
        return False

    return None


def _mask_value(value: Optional[str], visible_characters: int = 4) -> str:
    """Mask a sensitive value before including it in a diagnostic response."""
    if not value:
        return "not configured"

    if len(value) <= visible_characters:
        return "*" * len(value)

    return f"{'*' * 8}{value[-visible_characters:]}"


def _build_check(
    *,
    key: str,
    name: str,
    category: str,
    status: str,
    message: str,
    required: bool = True,
    details: Optional[Dict[str, Any]] = None,
    recommendation: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a consistent deployment-readiness check result."""
    return {
        "key": key,
        "name": name,
        "category": category,
        "status": status,
        "required": required,
        "message": message,
        "details": details or {},
        "recommendation": recommendation,
    }


def _get_environment_name() -> str:
    """Return the configured runtime environment."""
    return (
        os.getenv("APP_ENV")
        or os.getenv("ENVIRONMENT")
        or os.getenv("FASTAPI_ENV")
        or "development"
    ).strip().lower()


def _get_database_url_summary() -> Dict[str, Any]:
    """
    Return non-sensitive information about the configured database.

    Database passwords are never returned.
    """
    database_host = os.getenv("DB_HOST")
    database_port = os.getenv("DB_PORT")
    database_name = os.getenv("DB_NAME")
    database_user = os.getenv("DB_USER")
    ssl_mode = os.getenv("DB_SSLMODE") or os.getenv("PGSSLMODE")

    return {
        "host_configured": bool(database_host),
        "port": database_port,
        "database_name": database_name,
        "user": database_user,
        "ssl_mode": ssl_mode,
        "password": _mask_value(os.getenv("DB_PASSWORD")),
    }


# ---------------------------------------------------------------------------
# Individual readiness checks
# ---------------------------------------------------------------------------

def check_application_environment() -> Dict[str, Any]:
    """Check whether the application environment is explicitly configured."""
    environment = _get_environment_name()

    if environment in {"production", "prod"}:
        return _build_check(
            key="application_environment",
            name="Application environment",
            category="application",
            status=STATUS_PASS,
            message="Application is configured for production.",
            details={"environment": environment},
        )

    if environment in {"staging", "pilot", "uat", "test"}:
        return _build_check(
            key="application_environment",
            name="Application environment",
            category="application",
            status=STATUS_WARNING,
            message=f"Application is configured for the '{environment}' environment.",
            details={"environment": environment},
            recommendation=(
                "Set APP_ENV=production before a commercial production deployment."
            ),
        )

    return _build_check(
        key="application_environment",
        name="Application environment",
        category="application",
        status=STATUS_WARNING,
        message="Application is currently using a development environment.",
        details={"environment": environment},
        recommendation=(
            "Set APP_ENV=pilot for customer pilot deployment or "
            "APP_ENV=production for commercial deployment."
        ),
    )


def check_debug_mode() -> Dict[str, Any]:
    """Check whether application debug mode is disabled."""
    debug_value = (
        os.getenv("DEBUG")
        or os.getenv("APP_DEBUG")
        or os.getenv("FASTAPI_DEBUG")
    )

    debug_enabled = _normalise_boolean(debug_value)
    environment = _get_environment_name()

    if debug_enabled is False:
        return _build_check(
            key="debug_mode",
            name="Debug mode",
            category="security",
            status=STATUS_PASS,
            message="Debug mode is disabled.",
            details={"debug": False},
        )

    if debug_enabled is True:
        return _build_check(
            key="debug_mode",
            name="Debug mode",
            category="security",
            status=STATUS_FAIL if environment in {"production", "prod"} else STATUS_WARNING,
            message="Debug mode is enabled.",
            details={"debug": True},
            recommendation="Set DEBUG=false before deployment.",
        )

    return _build_check(
        key="debug_mode",
        name="Debug mode",
        category="security",
        status=STATUS_WARNING,
        message="Debug mode is not explicitly configured.",
        details={"debug": None},
        recommendation="Add DEBUG=false to the deployment environment variables.",
    )


def check_secret_key() -> Dict[str, Any]:
    """Validate the JWT/application secret configuration."""
    secret = (
        os.getenv("SECRET_KEY")
        or os.getenv("JWT_SECRET_KEY")
        or os.getenv("AUTH_SECRET_KEY")
    )

    if not secret:
        return _build_check(
            key="secret_key",
            name="Authentication secret",
            category="security",
            status=STATUS_FAIL,
            message="No authentication secret key is configured.",
            recommendation=(
                "Configure SECRET_KEY or JWT_SECRET_KEY with a securely generated "
                "random value of at least 32 characters."
            ),
        )

    weak_values = {
        "secret",
        "changeme",
        "change-me",
        "development",
        "dev-secret",
        "your-secret-key",
        "supersecret",
        "password",
    }

    if secret.strip().lower() in weak_values:
        return _build_check(
            key="secret_key",
            name="Authentication secret",
            category="security",
            status=STATUS_FAIL,
            message="The configured authentication secret is a known weak value.",
            details={
                "configured": True,
                "length": len(secret),
            },
            recommendation="Replace the secret with a cryptographically random value.",
        )

    if len(secret) < 32:
        return _build_check(
            key="secret_key",
            name="Authentication secret",
            category="security",
            status=STATUS_WARNING,
            message="Authentication secret is configured but shorter than recommended.",
            details={
                "configured": True,
                "length": len(secret),
            },
            recommendation="Use a secret containing at least 32 random characters.",
        )

    return _build_check(
        key="secret_key",
        name="Authentication secret",
        category="security",
        status=STATUS_PASS,
        message="Authentication secret is configured.",
        details={
            "configured": True,
            "length": len(secret),
            "masked_value": _mask_value(secret),
        },
    )


def check_database_configuration() -> Dict[str, Any]:
    """Check whether essential database environment variables are available."""
    database_url = os.getenv("DATABASE_URL")

    required_individual_variables = [
        "DB_HOST",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
    ]

    configured_individual_variables = {
        variable: bool(os.getenv(variable))
        for variable in required_individual_variables
    }

    all_individual_variables_exist = all(
        configured_individual_variables.values()
    )

    if database_url or all_individual_variables_exist:
        return _build_check(
            key="database_configuration",
            name="Database configuration",
            category="database",
            status=STATUS_PASS,
            message="Database connection configuration is available.",
            details={
                "database_url_configured": bool(database_url),
                "individual_variables": configured_individual_variables,
                "database": _get_database_url_summary(),
            },
        )

    missing_variables = [
        variable
        for variable, configured in configured_individual_variables.items()
        if not configured
    ]

    return _build_check(
        key="database_configuration",
        name="Database configuration",
        category="database",
        status=STATUS_FAIL,
        message="Database configuration is incomplete.",
        details={
            "database_url_configured": bool(database_url),
            "missing_variables": missing_variables,
            "database": _get_database_url_summary(),
        },
        recommendation=(
            "Configure DATABASE_URL or all DB_HOST, DB_NAME, DB_USER, "
            "and DB_PASSWORD environment variables."
        ),
    )


def check_database_connection(
    database_engine: Engine = engine,
) -> Dict[str, Any]:
    """Test the application's SQLAlchemy database connection."""
    try:
        with database_engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            scalar_result = result.scalar()

        if scalar_result == 1:
            return _build_check(
                key="database_connection",
                name="Database connection",
                category="database",
                status=STATUS_PASS,
                message="Database connection is healthy.",
                details={
                    "query": "SELECT 1",
                    "result": scalar_result,
                },
            )

        return _build_check(
            key="database_connection",
            name="Database connection",
            category="database",
            status=STATUS_WARNING,
            message="Database responded with an unexpected health-check result.",
            details={"result": scalar_result},
        )

    except SQLAlchemyError as exc:
        logger.exception("Deployment readiness database check failed.")

        return _build_check(
            key="database_connection",
            name="Database connection",
            category="database",
            status=STATUS_FAIL,
            message="Unable to connect to the application database.",
            details={
                "error_type": type(exc).__name__,
                "error": str(exc),
            },
            recommendation=(
                "Verify database credentials, firewall rules, SSL configuration, "
                "database availability, and network access."
            ),
        )

    except Exception as exc:
        logger.exception("Unexpected deployment readiness database error.")

        return _build_check(
            key="database_connection",
            name="Database connection",
            category="database",
            status=STATUS_FAIL,
            message="An unexpected database connectivity error occurred.",
            details={
                "error_type": type(exc).__name__,
                "error": str(exc),
            },
            recommendation="Review the backend logs and database configuration.",
        )


def check_database_schema(
    database_engine: Engine = engine,
) -> List[Dict[str, Any]]:
    """Check required and recommended database tables."""
    checks: List[Dict[str, Any]] = []

    try:
        inspector = inspect(database_engine)
        existing_tables = set(inspector.get_table_names())

        missing_required = [
            table
            for table in REQUIRED_DATABASE_TABLES
            if table not in existing_tables
        ]

        missing_recommended = [
            table
            for table in RECOMMENDED_DATABASE_TABLES
            if table not in existing_tables
        ]

        if missing_required:
            checks.append(
                _build_check(
                    key="required_database_tables",
                    name="Required database tables",
                    category="database",
                    status=STATUS_FAIL,
                    message="One or more required database tables are missing.",
                    details={
                        "required_tables": REQUIRED_DATABASE_TABLES,
                        "missing_tables": missing_required,
                        "existing_table_count": len(existing_tables),
                    },
                    recommendation=(
                        "Run the latest Alembic migrations and verify that the "
                        "authentication and company tables were created."
                    ),
                )
            )
        else:
            checks.append(
                _build_check(
                    key="required_database_tables",
                    name="Required database tables",
                    category="database",
                    status=STATUS_PASS,
                    message="All required database tables are available.",
                    details={
                        "required_tables": REQUIRED_DATABASE_TABLES,
                        "existing_table_count": len(existing_tables),
                    },
                )
            )

        if missing_recommended:
            checks.append(
                _build_check(
                    key="recommended_database_tables",
                    name="Recommended database tables",
                    category="database",
                    status=STATUS_WARNING,
                    required=False,
                    message="Some recommended application tables were not detected.",
                    details={
                        "recommended_tables": RECOMMENDED_DATABASE_TABLES,
                        "missing_tables": missing_recommended,
                    },
                    recommendation=(
                        "Confirm the table names used by the current SQLAlchemy "
                        "models and apply any pending database migrations."
                    ),
                )
            )
        else:
            checks.append(
                _build_check(
                    key="recommended_database_tables",
                    name="Recommended database tables",
                    category="database",
                    status=STATUS_PASS,
                    required=False,
                    message="All recommended application tables are available.",
                    details={
                        "recommended_tables": RECOMMENDED_DATABASE_TABLES,
                    },
                )
            )

    except SQLAlchemyError as exc:
        logger.exception("Unable to inspect database schema.")

        checks.append(
            _build_check(
                key="database_schema",
                name="Database schema",
                category="database",
                status=STATUS_FAIL,
                message="Unable to inspect the database schema.",
                details={
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
                recommendation=(
                    "Resolve database connectivity before checking schema readiness."
                ),
            )
        )

    except Exception as exc:
        logger.exception("Unexpected schema inspection error.")

        checks.append(
            _build_check(
                key="database_schema",
                name="Database schema",
                category="database",
                status=STATUS_FAIL,
                message="An unexpected schema inspection error occurred.",
                details={
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
                recommendation="Review backend logs and SQLAlchemy configuration.",
            )
        )

    return checks


def check_required_directories() -> List[Dict[str, Any]]:
    """Check required and optional backend directories."""
    checks: List[Dict[str, Any]] = []

    for directory_name, directory_path in REQUIRED_DIRECTORIES.items():
        exists = directory_path.exists()
        is_directory = directory_path.is_dir() if exists else False

        checks.append(
            _build_check(
                key=f"directory_{directory_name}",
                name=f"{directory_name.replace('_', ' ').title()} directory",
                category="filesystem",
                status=STATUS_PASS if exists and is_directory else STATUS_FAIL,
                message=(
                    f"Directory exists: {directory_path}"
                    if exists and is_directory
                    else f"Required directory is missing: {directory_path}"
                ),
                details={
                    "path": str(directory_path),
                    "exists": exists,
                    "is_directory": is_directory,
                },
                recommendation=(
                    None
                    if exists and is_directory
                    else f"Create the directory: {directory_path}"
                ),
            )
        )

    for directory_name, directory_path in OPTIONAL_DIRECTORIES.items():
        exists = directory_path.exists()
        is_directory = directory_path.is_dir() if exists else False

        checks.append(
            _build_check(
                key=f"directory_{directory_name}",
                name=f"{directory_name.replace('_', ' ').title()} directory",
                category="filesystem",
                status=STATUS_PASS if exists and is_directory else STATUS_WARNING,
                required=False,
                message=(
                    f"Directory exists: {directory_path}"
                    if exists and is_directory
                    else f"Optional directory is not available: {directory_path}"
                ),
                details={
                    "path": str(directory_path),
                    "exists": exists,
                    "is_directory": is_directory,
                },
                recommendation=(
                    None
                    if exists and is_directory
                    else f"Create the directory before deployment: {directory_path}"
                ),
            )
        )

    return checks


def check_directory_writability() -> List[Dict[str, Any]]:
    """
    Check whether relevant directories appear writable.

    This uses os.access and does not create temporary files.
    """
    checks: List[Dict[str, Any]] = []

    directories_to_check = {
        **REQUIRED_DIRECTORIES,
        **OPTIONAL_DIRECTORIES,
    }

    for directory_name, directory_path in directories_to_check.items():
        if not directory_path.exists() or not directory_path.is_dir():
            continue

        writable = os.access(directory_path, os.W_OK)

        checks.append(
            _build_check(
                key=f"directory_writable_{directory_name}",
                name=f"{directory_name.replace('_', ' ').title()} writability",
                category="filesystem",
                status=STATUS_PASS if writable else STATUS_WARNING,
                required=directory_name in REQUIRED_DIRECTORIES,
                message=(
                    f"Directory is writable: {directory_path}"
                    if writable
                    else f"Directory may not be writable: {directory_path}"
                ),
                details={
                    "path": str(directory_path),
                    "writable": writable,
                },
                recommendation=(
                    None
                    if writable
                    else "Review the deployment user and filesystem permissions."
                ),
            )
        )

    return checks


def _get_package_version(package_name: str) -> Optional[str]:
    """Return an installed package version or None."""
    package_candidates = [package_name]

    # Distribution names can differ from import names.
    aliases = {
        "psycopg2-binary": ["psycopg2-binary", "psycopg2"],
        "python-jose": ["python-jose"],
    }

    package_candidates = aliases.get(package_name, package_candidates)

    for candidate in package_candidates:
        try:
            return metadata.version(candidate)
        except metadata.PackageNotFoundError:
            continue

    return None


def check_python_packages() -> List[Dict[str, Any]]:
    """Check required and recommended Python package installations."""
    checks: List[Dict[str, Any]] = []

    required_versions = {
        package: _get_package_version(package)
        for package in REQUIRED_PACKAGES
    }

    missing_required = [
        package
        for package, version in required_versions.items()
        if version is None
    ]

    if missing_required:
        checks.append(
            _build_check(
                key="required_python_packages",
                name="Required Python packages",
                category="dependencies",
                status=STATUS_FAIL,
                message="One or more required Python packages are missing.",
                details={
                    "packages": required_versions,
                    "missing_packages": missing_required,
                },
                recommendation=(
                    "Activate the backend virtual environment and run "
                    "'pip install -r requirements.txt'."
                ),
            )
        )
    else:
        checks.append(
            _build_check(
                key="required_python_packages",
                name="Required Python packages",
                category="dependencies",
                status=STATUS_PASS,
                message="All required Python packages are installed.",
                details={"packages": required_versions},
            )
        )

    recommended_versions = {
        package: _get_package_version(package)
        for package in RECOMMENDED_PACKAGES
    }

    missing_recommended = [
        package
        for package, version in recommended_versions.items()
        if version is None
    ]

    if missing_recommended:
        checks.append(
            _build_check(
                key="recommended_python_packages",
                name="Recommended Python packages",
                category="dependencies",
                status=STATUS_WARNING,
                required=False,
                message="Some recommended deployment packages were not detected.",
                details={
                    "packages": recommended_versions,
                    "missing_packages": missing_recommended,
                },
                recommendation=(
                    "Review requirements.txt and install any packages used by "
                    "authentication, PostgreSQL, and migration services."
                ),
            )
        )
    else:
        checks.append(
            _build_check(
                key="recommended_python_packages",
                name="Recommended Python packages",
                category="dependencies",
                status=STATUS_PASS,
                required=False,
                message="All recommended deployment packages are installed.",
                details={"packages": recommended_versions},
            )
        )

    return checks


def check_cors_configuration() -> Dict[str, Any]:
    """Review deployment CORS origins supplied through environment variables."""
    raw_origins = (
        os.getenv("CORS_ORIGINS")
        or os.getenv("ALLOWED_ORIGINS")
        or ""
    )

    origins = [
        origin.strip()
        for origin in raw_origins.split(",")
        if origin.strip()
    ]

    environment = _get_environment_name()
    production_environment = environment in {"production", "prod"}

    if not origins:
        return _build_check(
            key="cors_configuration",
            name="CORS configuration",
            category="security",
            status=STATUS_WARNING,
            message="No environment-based CORS origins were detected.",
            details={"origins": []},
            recommendation=(
                "Configure CORS_ORIGINS with the deployed frontend domain. "
                "Also confirm that app/main.py reads this environment variable."
            ),
        )

    wildcard_configured = "*" in origins

    if wildcard_configured and production_environment:
        return _build_check(
            key="cors_configuration",
            name="CORS configuration",
            category="security",
            status=STATUS_FAIL,
            message="Wildcard CORS is configured in the production environment.",
            details={"origins": origins},
            recommendation=(
                "Replace '*' with the exact HTTPS frontend domain or domains."
            ),
        )

    local_origins = [
        origin
        for origin in origins
        if "localhost" in origin or "127.0.0.1" in origin
    ]

    if production_environment and local_origins:
        return _build_check(
            key="cors_configuration",
            name="CORS configuration",
            category="security",
            status=STATUS_WARNING,
            message="Production CORS configuration still contains local origins.",
            details={
                "origins": origins,
                "local_origins": local_origins,
            },
            recommendation=(
                "Add the production HTTPS frontend domain and remove unnecessary "
                "localhost origins."
            ),
        )

    return _build_check(
        key="cors_configuration",
        name="CORS configuration",
        category="security",
        status=STATUS_PASS,
        message="CORS origins are explicitly configured.",
        details={"origins": origins},
    )


def check_https_configuration() -> Dict[str, Any]:
    """Check whether HTTPS enforcement is configured."""
    force_https_value = (
        os.getenv("FORCE_HTTPS")
        or os.getenv("HTTPS_ONLY")
        or os.getenv("SECURE_COOKIES")
    )

    force_https = _normalise_boolean(force_https_value)
    environment = _get_environment_name()

    if force_https is True:
        return _build_check(
            key="https_configuration",
            name="HTTPS configuration",
            category="security",
            status=STATUS_PASS,
            message="HTTPS or secure-cookie enforcement is enabled.",
            details={"enabled": True},
        )

    if environment in {"production", "prod"}:
        return _build_check(
            key="https_configuration",
            name="HTTPS configuration",
            category="security",
            status=STATUS_WARNING,
            message="HTTPS enforcement was not detected for production.",
            details={"enabled": force_https},
            recommendation=(
                "Enable HTTPS at the hosting platform or reverse proxy and set "
                "secure authentication cookie settings."
            ),
        )

    return _build_check(
        key="https_configuration",
        name="HTTPS configuration",
        category="security",
        status=STATUS_WARNING,
        required=False,
        message="HTTPS enforcement is not enabled in the current environment.",
        details={"enabled": force_https},
        recommendation="Enable HTTPS before external customer deployment.",
    )


def check_demo_mode() -> Dict[str, Any]:
    """Check whether demo mode is appropriately configured."""
    demo_value = (
        os.getenv("DEMO_MODE")
        or os.getenv("ENABLE_DEMO_MODE")
    )

    demo_enabled = _normalise_boolean(demo_value)
    environment = _get_environment_name()

    if environment in {"production", "prod"} and demo_enabled is True:
        return _build_check(
            key="demo_mode",
            name="Demo mode",
            category="application",
            status=STATUS_WARNING,
            message="Demo mode is enabled in production.",
            details={"enabled": True},
            recommendation=(
                "Disable demo data loading in commercial production, or protect "
                "demo endpoints with administrator authorization."
            ),
        )

    if demo_enabled is False:
        return _build_check(
            key="demo_mode",
            name="Demo mode",
            category="application",
            status=STATUS_PASS,
            message="Demo mode is disabled.",
            details={"enabled": False},
        )

    if environment in {"pilot", "staging", "uat", "test", "development"}:
        return _build_check(
            key="demo_mode",
            name="Demo mode",
            category="application",
            status=STATUS_PASS,
            required=False,
            message="Demo mode configuration is acceptable for this environment.",
            details={"enabled": demo_enabled},
        )

    return _build_check(
        key="demo_mode",
        name="Demo mode",
        category="application",
        status=STATUS_WARNING,
        required=False,
        message="Demo mode is not explicitly configured.",
        details={"enabled": None},
        recommendation=(
            "Set DEMO_MODE=false for production or DEMO_MODE=true for a "
            "controlled demonstration environment."
        ),
    )


def check_logging_configuration() -> Dict[str, Any]:
    """Check basic application logging configuration."""
    log_level = os.getenv("LOG_LEVEL")

    if not log_level:
        return _build_check(
            key="logging_configuration",
            name="Logging configuration",
            category="operations",
            status=STATUS_WARNING,
            message="LOG_LEVEL is not explicitly configured.",
            details={"log_level": None},
            recommendation=(
                "Set LOG_LEVEL=INFO for pilot or production deployments."
            ),
        )

    normalised_level = log_level.strip().upper()
    valid_levels = {
        "CRITICAL",
        "ERROR",
        "WARNING",
        "INFO",
        "DEBUG",
        "NOTSET",
    }

    if normalised_level not in valid_levels:
        return _build_check(
            key="logging_configuration",
            name="Logging configuration",
            category="operations",
            status=STATUS_WARNING,
            message="LOG_LEVEL contains an unrecognised value.",
            details={"log_level": normalised_level},
            recommendation=(
                "Use CRITICAL, ERROR, WARNING, INFO, or DEBUG."
            ),
        )

    if (
        normalised_level == "DEBUG"
        and _get_environment_name() in {"production", "prod"}
    ):
        return _build_check(
            key="logging_configuration",
            name="Logging configuration",
            category="operations",
            status=STATUS_WARNING,
            message="Production logging is configured at DEBUG level.",
            details={"log_level": normalised_level},
            recommendation=(
                "Use LOG_LEVEL=INFO or LOG_LEVEL=WARNING in production."
            ),
        )

    return _build_check(
        key="logging_configuration",
        name="Logging configuration",
        category="operations",
        status=STATUS_PASS,
        message=f"Logging level is configured as {normalised_level}.",
        details={"log_level": normalised_level},
    )


def check_migration_configuration() -> Dict[str, Any]:
    """Check whether Alembic migration configuration exists."""
    alembic_ini = BACKEND_ROOT / "alembic.ini"
    migrations_directory = BACKEND_ROOT / "alembic"

    ini_exists = alembic_ini.exists()
    directory_exists = migrations_directory.exists()

    if ini_exists and directory_exists:
        return _build_check(
            key="migration_configuration",
            name="Database migrations",
            category="database",
            status=STATUS_PASS,
            message="Alembic migration configuration is available.",
            details={
                "alembic_ini": str(alembic_ini),
                "migrations_directory": str(migrations_directory),
            },
        )

    return _build_check(
        key="migration_configuration",
        name="Database migrations",
        category="database",
        status=STATUS_WARNING,
        message="Complete Alembic migration configuration was not detected.",
        details={
            "alembic_ini_exists": ini_exists,
            "migrations_directory_exists": directory_exists,
            "alembic_ini": str(alembic_ini),
            "migrations_directory": str(migrations_directory),
        },
        recommendation=(
            "Verify that alembic.ini and the Alembic migration directory are "
            "included in the deployment package."
        ),
    )


def check_requirements_file() -> Dict[str, Any]:
    """Check whether a dependency requirements file exists."""
    possible_files = [
        BACKEND_ROOT / "requirements.txt",
        BACKEND_ROOT / "requirements-prod.txt",
        BACKEND_ROOT / "pyproject.toml",
    ]

    existing_files = [
        str(path)
        for path in possible_files
        if path.exists()
    ]

    if existing_files:
        return _build_check(
            key="requirements_file",
            name="Dependency manifest",
            category="dependencies",
            status=STATUS_PASS,
            message="A Python dependency manifest is available.",
            details={"files": existing_files},
        )

    return _build_check(
        key="requirements_file",
        name="Dependency manifest",
        category="dependencies",
        status=STATUS_FAIL,
        message="No Python dependency manifest was detected.",
        details={
            "checked_paths": [str(path) for path in possible_files],
        },
        recommendation=(
            "Create requirements.txt or pyproject.toml before deployment."
        ),
    )


# ---------------------------------------------------------------------------
# Scoring and report generation
# ---------------------------------------------------------------------------

def _calculate_score(checks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate deployment readiness score.

    Required checks have more influence than optional checks.

    Required check:
        pass = 4 points
        warning = 2 points
        fail = 0 points

    Optional check:
        pass = 2 points
        warning = 1 point
        fail = 0 points
    """
    earned_points = 0
    maximum_points = 0

    for check in checks:
        required = bool(check.get("required", True))
        status = check.get("status")

        if required:
            maximum_points += 4

            if status == STATUS_PASS:
                earned_points += 4
            elif status == STATUS_WARNING:
                earned_points += 2
        else:
            maximum_points += 2

            if status == STATUS_PASS:
                earned_points += 2
            elif status == STATUS_WARNING:
                earned_points += 1

    percentage = (
        round((earned_points / maximum_points) * 100)
        if maximum_points
        else 0
    )

    return {
        "earned_points": earned_points,
        "maximum_points": maximum_points,
        "percentage": percentage,
    }


def _determine_readiness(
    checks: List[Dict[str, Any]],
    score_percentage: int,
) -> Dict[str, str]:
    """Determine the overall deployment status."""
    required_failures = [
        check
        for check in checks
        if check.get("required", True)
        and check.get("status") == STATUS_FAIL
    ]

    all_failures = [
        check
        for check in checks
        if check.get("status") == STATUS_FAIL
    ]

    if required_failures:
        return {
            "status": "not_ready",
            "label": "Not Ready",
            "message": (
                "Deployment is blocked by one or more failed required checks."
            ),
        }

    if all_failures or score_percentage < 70:
        return {
            "status": "needs_attention",
            "label": "Needs Attention",
            "message": (
                "Major deployment issues should be resolved before customer use."
            ),
        }

    if score_percentage < 90:
        return {
            "status": "pilot_ready",
            "label": "Pilot Ready",
            "message": (
                "The application is suitable for a controlled pilot after "
                "reviewing the remaining warnings."
            ),
        }

    return {
        "status": "production_ready",
        "label": "Production Ready",
        "message": (
            "The application passed the principal deployment-readiness checks."
        ),
    }


def get_deployment_readiness(
    database_engine: Engine = engine,
) -> Dict[str, Any]:
    """
    Run all deployment-readiness checks.

    This is the main function that should be called by the API router.

    Returns:
        Dictionary containing:
        - overall readiness
        - readiness score
        - summary counts
        - grouped checks
        - environment information
        - recommendations
    """
    checks: List[Dict[str, Any]] = []

    # Application and security
    checks.append(check_application_environment())
    checks.append(check_debug_mode())
    checks.append(check_secret_key())
    checks.append(check_cors_configuration())
    checks.append(check_https_configuration())
    checks.append(check_demo_mode())

    # Database
    database_configuration_check = check_database_configuration()
    checks.append(database_configuration_check)

    database_connection_check = check_database_connection(database_engine)
    checks.append(database_connection_check)

    if database_connection_check["status"] == STATUS_PASS:
        checks.extend(check_database_schema(database_engine))

    checks.append(check_migration_configuration())

    # Filesystem
    checks.extend(check_required_directories())
    checks.extend(check_directory_writability())

    # Dependencies
    checks.append(check_requirements_file())
    checks.extend(check_python_packages())

    # Operations
    checks.append(check_logging_configuration())

    score = _calculate_score(checks)
    readiness = _determine_readiness(
        checks=checks,
        score_percentage=score["percentage"],
    )

    pass_count = sum(
        1 for check in checks if check["status"] == STATUS_PASS
    )
    warning_count = sum(
        1 for check in checks if check["status"] == STATUS_WARNING
    )
    fail_count = sum(
        1 for check in checks if check["status"] == STATUS_FAIL
    )

    blocking_checks = [
        check
        for check in checks
        if check.get("required", True)
        and check["status"] == STATUS_FAIL
    ]

    recommendations = [
        {
            "key": check["key"],
            "name": check["name"],
            "status": check["status"],
            "recommendation": check["recommendation"],
        }
        for check in checks
        if check.get("recommendation")
    ]

    grouped_checks: Dict[str, List[Dict[str, Any]]] = {}

    for check in checks:
        category = check.get("category", "other")
        grouped_checks.setdefault(category, []).append(check)

    return {
        "service": "Mine Manager AI Deployment Readiness",
        "generated_at": _utc_now_iso(),
        "readiness": readiness,
        "score": score,
        "summary": {
            "total_checks": len(checks),
            "passed": pass_count,
            "warnings": warning_count,
            "failed": fail_count,
            "blocking_failures": len(blocking_checks),
        },
        "blocking_checks": blocking_checks,
        "recommendations": recommendations,
        "checks": checks,
        "grouped_checks": grouped_checks,
        "runtime": {
            "environment": _get_environment_name(),
            "python_version": platform.python_version(),
            "python_implementation": platform.python_implementation(),
            "operating_system": platform.system(),
            "operating_system_release": platform.release(),
            "platform": platform.platform(),
            "architecture": platform.machine(),
            "executable": sys.executable,
            "backend_root": str(BACKEND_ROOT),
        },
    }


# Backward-compatible aliases in case the router uses another function name.

def run_deployment_readiness_checks(
    database_engine: Engine = engine,
) -> Dict[str, Any]:
    """Alias for get_deployment_readiness."""
    return get_deployment_readiness(database_engine)


def get_deployment_readiness_report(
    database_engine: Engine = engine,
) -> Dict[str, Any]:
    """Alias for get_deployment_readiness."""
    return get_deployment_readiness(database_engine)