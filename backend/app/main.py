from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

# Alembic now manages database schema changes.
# Keep create_all disabled to avoid unexpected schema changes.
# models.Base.metadata.create_all(bind=engine)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "status": "healthy"
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