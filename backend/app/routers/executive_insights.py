from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    require_operational_editor,
)
from app.database import get_db
from app.models.user import User
from app.services.executive_summary_service_v2 import (
    get_executive_summary_v2,
)
from app.services.tenant_service import (
    resolve_authenticated_tenant,
)


router = APIRouter(
    prefix="/api/executive-insights",
    tags=["Executive Insights"],
    dependencies=[
        Depends(get_current_user),
    ],
)


@router.get(
    "",
    dependencies=[
        Depends(require_operational_editor),
    ],
)
def get_executive_insights(
    mine_name: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=255,
        description=(
            "Optional mine name retained for API compatibility. "
            "The authenticated tenant determines the active mine."
        ),
    ),
    scenario: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=100,
        description=(
            "Optional active executive demo scenario. "
            "When omitted, the service runs in live mode."
        ),
    ),
    language: str = Query(
        default="en",
        min_length=2,
        max_length=20,
        description=(
            "Language used for executive insight narrative. "
            "Supported values are 'en' and 'mn'."
        ),
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate structured executive insights for the
    authenticated tenant.

    Tenant security:
        authenticated user
            -> tenant service
            -> company + mine
            -> executive insight data

    The optional mine_name query parameter is retained only
    for backward compatibility and does not determine the
    active tenant.

    Live mode:
        Uses PostgreSQL KPI and trend data.

    Demo mode:
        Accepts an optional scenario name so the
        executive insight service can return
        scenario-aware decision-support content.

    Language:
        en = English
        mn = Mongolian

    Allowed roles:
        - Superintendent
        - Mine Manager
        - General Manager
        - Administrator
    """

    tenant = resolve_authenticated_tenant(
        db=db,
        current_user=current_user,
    )

    resolved_mine_name = (
        tenant["mine_name"]
    )

    normalized_scenario = (
        scenario.strip()
        if scenario is not None
        else None
    )

    normalized_language = (
        language.strip().lower()
        if language
        else "en"
    )

    if normalized_language in {
        "mn",
        "mon",
        "mongolian",
        "монгол",
    }:
        normalized_language = "mn"
    else:
        normalized_language = "en"

    return get_executive_summary_v2(
        mine_name=resolved_mine_name,
        db=db,
        scenario=normalized_scenario,
        language=normalized_language,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
        operation_profile=tenant[
            "operation_profile"
        ],
    )


@router.get("/health")
def executive_insights_health():
    """
    Return the health status of the Executive Insights module.

    All authenticated roles may access this endpoint.
    """

    return {
        "service": "Executive Insights",
        "status": "active",
        "version": "1.0",
        "scenario_support": True,
        "language_support": True,
        "supported_languages": [
            "en",
            "mn",
        ],
        "modes": [
            "live",
            "demo",
        ],
    }