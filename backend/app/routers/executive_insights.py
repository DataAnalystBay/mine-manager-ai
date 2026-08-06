from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    require_operational_editor,
)
from app.database import get_db
from app.services.executive_summary_service_v2 import (
    get_executive_summary_v2,
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
    mine_name: str = Query(
        default="Oyu Tolgoi Surface",
        min_length=1,
        max_length=255,
        description=(
            "Mine name used to generate executive insights."
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
    db: Session = Depends(get_db),
):
    """
    Generate structured executive insights.

    Live mode:
        Uses PostgreSQL KPI and trend data.

    Demo mode:
        Accepts an optional scenario name so the
        executive insight service can return
        scenario-aware decision-support content.

    Allowed roles:
        - Superintendent
        - Mine Manager
        - General Manager
        - Administrator
    """

    normalized_mine_name = mine_name.strip()

    normalized_scenario = (
        scenario.strip()
        if scenario is not None
        else None
    )

    return get_executive_summary_v2(
        mine_name=normalized_mine_name,
        db=db,
        scenario=normalized_scenario,
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
        "modes": [
            "live",
            "demo",
        ],
    }