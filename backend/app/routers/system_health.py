from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from fastapi.responses import JSONResponse

from app.auth.dependencies import (
    get_current_user,
    require_general_manager_or_administrator,
)
from app.services.system_health_service import (
    get_system_health,
)


router = APIRouter(
    prefix="/api/system-health",
    tags=["System Health"],
    dependencies=[
        Depends(get_current_user),
    ],
)


# ============================================================
# DETAILED SYSTEM HEALTH
# ============================================================

@router.get(
    "",
    dependencies=[
        Depends(require_general_manager_or_administrator),
    ],
)
def read_system_health(
    force_refresh: bool = Query(
        default=False,
        description=(
            "Bypass the System Health cache and run "
            "a fresh service check."
        ),
    ),
):
    """
    Return the current health of Mine Manager AI services.

    General Manager or Administrator access is required.

    Normal requests may use the short-lived System Health cache.

    Set force_refresh=true to bypass the cache and execute
    a fresh Database, Demo Data, API, AI, and Storage check.
    """

    health = get_system_health(
        force_refresh=force_refresh,
    )

    status_code = 200

    if (
        health.get("overall_status")
        == "unhealthy"
    ):
        status_code = 503

    return JSONResponse(
        status_code=status_code,
        content=health,
    )


# ============================================================
# LIGHTWEIGHT HEALTH CHECK
# ============================================================

@router.get("/ping")
def ping_system_health():
    """
    Lightweight API availability check.

    All authenticated users may access this endpoint.

    This endpoint does not run database
    or infrastructure checks.
    """

    return {
        "status": "healthy",
        "message": (
            "Mine Manager AI backend is running"
        ),
    }