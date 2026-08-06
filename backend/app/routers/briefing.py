from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.services.ai_service import generate_briefing


router = APIRouter(
    prefix="/briefing",
    tags=["AI Briefing"],
    dependencies=[
        Depends(get_current_user),
    ],
)


@router.get("/test")
def briefing_test():
    """
    Test endpoint for the AI Briefing Engine.

    Protected by JWT authentication.
    """

    kpi_data = {
        "status": "GREEN",
        "production_score": 102.3,
        "waste_score": 98.1,
        "overall_score": 100.2,
    }

    briefing = generate_briefing(kpi_data)

    return {
        "briefing": briefing,
    }