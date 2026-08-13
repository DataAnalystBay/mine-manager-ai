from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models
from app.database import engine
from app.routers import reports
from app.routers import (
    ai,
    analytics,
    audit_logs,
    auth,
    briefing,
    config,
    dashboard,
    demo,
    executive_actions,
    executive_insights,
    executive_kpi_pdf,
    executive_recommendations,
    fleet,
    plant,
    safety,
    production,
    system_health,
    upload,
    users,
    predictions,
    deployment_readiness,
    support_diagnostics,
)


# --------------------------------------------------
# Create Database Tables
# --------------------------------------------------

# Alembic manages database schema changes.
# Keep create_all disabled to avoid unexpected schema changes.
#
# models.Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# Application Settings
# --------------------------------------------------

APP_NAME = "Mine Manager AI"

APP_VERSION = os.getenv(
    "APP_VERSION",
    "1.0.3",
)

APP_ENVIRONMENT = os.getenv(
    "APP_ENV",
    "development",
)


# --------------------------------------------------
# Application Paths
# --------------------------------------------------

BACKEND_ROOT = Path(__file__).resolve().parents[1]

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


# --------------------------------------------------
# Runtime Directories
# --------------------------------------------------

# Required runtime directories are created automatically
# so a fresh deployment does not require manual setup.

LOG_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

UPLOAD_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

STATIC_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

LOGO_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="Mine Manager AI API",
    description=(
        "Backend API for Mine Manager AI "
        "Executive Decision Platform"
    ),
    version=APP_VERSION,
)


# --------------------------------------------------
# Static Files
# --------------------------------------------------

app.mount(
    "/static",
    StaticFiles(
        directory=str(STATIC_DIRECTORY),
    ),
    name="static",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

default_cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "https://mine-manager-ai-zeta.vercel.app",
]


cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    ",".join(default_cors_origins),
)


cors_origins = [
    origin.strip().rstrip("/")
    for origin in cors_origins_raw.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=(
        r"https://mine-manager(?:-ai)?-[a-zA-Z0-9-]+\.vercel\.app"
    ),
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",
    ],
)


# --------------------------------------------------
# Routers
# --------------------------------------------------

# Authentication and administration

app.include_router(
    auth.router
)

app.include_router(
    users.router
)

app.include_router(
    audit_logs.router
)

app.include_router(
    config.router
)


# Core operational modules

app.include_router(
    production.router
)

app.include_router(
    fleet.router
)

app.include_router(
    plant.router
)

app.include_router(
    safety.router
)

app.include_router(
    analytics.router
)

app.include_router(
    ai.router
)

app.include_router(
    briefing.router
)

app.include_router(
    upload.router
)


# Dashboard, demo and reports

app.include_router(
    dashboard.router
)

app.include_router(
    demo.router
)

app.include_router(
    reports.router
)


# Executive decision-support modules

app.include_router(
    executive_actions.router
)

app.include_router(
    executive_recommendations.router
)

app.include_router(
    executive_insights.router
)

app.include_router(
    executive_kpi_pdf.router
)


# System monitoring

app.include_router(
    system_health.router
)


# Prediction

app.include_router(
    predictions.router
)


# Deployment Readiness

app.include_router(
    deployment_readiness.router
)


# Support Diagnostics

app.include_router(
    support_diagnostics.router
)


# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------

@app.get(
    "/",
    tags=["Application"],
)
def root():
    return {
        "application": APP_NAME,
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
        "status": "Running",
    }


# --------------------------------------------------
# Lightweight Health Check
# --------------------------------------------------

@app.get(
    "/health",
    tags=["Application"],
)
def health():
    """
    Confirm that the FastAPI application is running.

    Detailed service health is available from
    /api/system-health.
    """

    return {
        "application": APP_NAME,
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
        "status": "healthy",
    }


# --------------------------------------------------
# API Information
# --------------------------------------------------

@app.get(
    "/api",
    tags=["Application"],
)
def api_information():
    return {
        "name": "Mine Manager AI API",
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
        "modules": [
            "Authentication",
            "User Management",
            "Audit Trail",
            "Production",
            "Fleet",
            "Plant",
            "Safety",
            "Analytics",
            "AI Decision Engine",
            "AI Daily Briefing",
            "Upload Center",
            "Executive Dashboard",
            "Executive Actions",
            "Executive Recommendations",
            "Executive Insights",
            "Executive Reports",
            "Executive KPI PDF Export",
            "Configuration",
            "Static Logo Hosting",
            "System Health",
            "Predictive Intelligence",
            "Deployment Readiness",
            "Support Diagnostics",
        ],
        "health_endpoints": {
            "lightweight": "/health",
            "system_ping": "/api/system-health/ping",
            "detailed": "/api/system-health",
            "executive_insights": (
                "/api/executive-insights/health"
            ),
        },
        "executive_insights_endpoints": {
            "generate": "/api/executive-insights",
            "health": "/api/executive-insights/health",
        },
    }
