from fastapi import APIRouter

from app.services.ai.kpi_engine import get_kpi_intelligence
from app.services.ai.risk_engine import get_operational_risks
from app.services.ai.recommendation_engine import get_recommendations
from app.services.ai.briefing_engine import get_daily_briefing
from app.services.ai.health_engine import get_mine_health_score

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Decision Engine"]
)


@router.get("/kpi")
def kpi_intelligence():
    return get_kpi_intelligence()


@router.get("/risks")
def operational_risks():
    return get_operational_risks()


@router.get("/recommendations")
def recommendations():
    return get_recommendations()


@router.get("/briefing")
def daily_briefing():
    return get_daily_briefing()


@router.get("/health")
def mine_health():
    return get_mine_health_score()