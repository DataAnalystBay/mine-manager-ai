from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.services.ai.briefing_engine import get_daily_briefing
from app.services.ai.health_engine import get_mine_health_score
from app.services.ai.kpi_engine import get_kpi_intelligence
from app.services.ai.recommendation_engine import get_recommendations
from app.services.ai.risk_engine import get_operational_risks


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Decision Engine"],
    dependencies=[
        Depends(get_current_user),
    ],
)


@router.get("/kpi")
def kpi_intelligence():
    """
    Return AI-generated KPI intelligence.

    Authentication is enforced at the router level.
    """

    return get_kpi_intelligence()


@router.get("/risks")
def operational_risks():
    """
    Return AI-generated operational risks.

    Authentication is enforced at the router level.
    """

    return get_operational_risks()


@router.get("/recommendations")
def recommendations():
    """
    Return AI-generated operational recommendations.

    Authentication is enforced at the router level.
    """

    return get_recommendations()


@router.get("/briefing")
def daily_briefing():
    """
    Return the AI-generated daily operational briefing.

    Authentication is enforced at the router level.
    """

    return get_daily_briefing()


@router.get("/health")
def mine_health():
    """
    Return the AI-generated Mine Health score.

    Authentication is enforced at the router level.
    """

    return get_mine_health_score()