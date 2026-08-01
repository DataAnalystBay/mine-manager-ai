from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.system_health_service import (
    get_system_health,
)


router = APIRouter(
    prefix="/api/system-health",
    tags=["System Health"],
)


@router.get("")
def read_system_health():
    """
    Return the current health of Mine Manager AI services.

    This endpoint is intended for authenticated administrators
    and customer support teams.
    """

    health = get_system_health()

    status_code = 200

    if health["overall_status"] == "unhealthy":
        status_code = 503

    return JSONResponse(
        status_code=status_code,
        content=health,
    )


@router.get("/ping")
def ping_system_health():
    """
    Lightweight API availability check.
    """

    return {
        "status": "healthy",
        "message": "Mine Manager AI backend is running",
    }