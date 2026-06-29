from fastapi import APIRouter
from app.services.ai_service import generate_briefing

router = APIRouter(
    prefix="/briefing",
    tags=["AI Briefing"]
)

@router.get("/test")
def briefing_test():

    kpi_data = {
        "status": "GREEN",
        "production_score": 102.3,
        "waste_score": 98.1,
        "overall_score": 100.2
    }

    briefing = generate_briefing(kpi_data)

    return {
        "briefing": briefing
    }