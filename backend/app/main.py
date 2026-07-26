from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import engine
from app import models
from app.routers import reports

from app.routers import (
    production,
    analytics,
    ai,
    briefing,
    upload,
    dashboard,
    auth,
    config,
    demo,
    executive_actions,
)

# --------------------------------------------------
# Create Database Tables
# --------------------------------------------------

# Alembic manages database schema changes.
# Keep create_all disabled to avoid unexpected schema changes.
# models.Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="Mine Manager AI API",
    description="Backend API for Mine Manager AI Executive Decision Platform",
    version="1.0.0",
)

# --------------------------------------------------
# Static Files
# --------------------------------------------------

app.mount(
    "/static",
    StaticFiles(directory="app/static"),
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
    # Allows Vercel preview deployments such as:
    # https://mine-manager-ai-abc123.vercel.app
    allow_origin_regex=r"https://mine-manager-ai-[a-zA-Z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# --------------------------------------------------
# Routers
# --------------------------------------------------

app.include_router(production.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(briefing.router)
app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(config.router)
app.include_router(demo.router)
app.include_router(reports.router)
app.include_router(executive_actions.router)

# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------


@app.get("/")
def root():
    return {
        "application": "Mine Manager AI",
        "version": "1.0.0",
        "status": "Running",
    }


# --------------------------------------------------
# Health Check
# --------------------------------------------------


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# --------------------------------------------------
# API Information
# --------------------------------------------------


@app.get("/api")
def api_information():
    return {
        "name": "Mine Manager AI API",
        "version": "1.0.0",
        "modules": [
            "Authentication",
            "Production",
            "Analytics",
            "AI Decision Engine",
            "AI Daily Briefing",
            "Upload Center",
            "Executive Dashboard",
            "Executive Actions",
            "Executive Reports",
            "Configuration",
            "Static Logo Hosting",
        ],
    }
