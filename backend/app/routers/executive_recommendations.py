from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.executive_recommendation.recommendation_engine import (
    generate_executive_recommendation,
)


router = APIRouter(
    prefix="/api/executive-recommendations",
    tags=["Executive Recommendations"],
)


class ExecutiveRecommendationRequest(BaseModel):
    kpi_key: str = Field(
        ...,
        examples=["ore_production"],
    )

    kpi_name: str = Field(
        ...,
        examples=["Ore Production"],
    )

    current_value: float = Field(
        ...,
        examples=[96],
    )

    target_value: float = Field(
        ...,
        examples=[100],
    )

    context: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        examples=[
            {
                "truck_availability": 87,
                "truck_utilisation": 81,
                "shovel_availability": 92,
                "backlog_tonnes": 12500,
                "active_pit": "Pit 3",
            }
        ],
    )


@router.get("/test")
def get_test_executive_recommendation():
    """
    Return a deterministic ore-production recommendation
    for API and Swagger testing.
    """

    return generate_executive_recommendation(
        kpi_key="ore_production",
        kpi_name="Ore Production",
        current_value=96,
        target_value=100,
        context={
            "truck_availability": 87,
            "truck_utilisation": 81,
            "shovel_availability": 92,
            "backlog_tonnes": 12500,
            "active_pit": "Pit 3",
        },
    )


@router.post("/generate")
def generate_recommendation(
    request: ExecutiveRecommendationRequest,
):
    """
    Generate an executive recommendation from supplied
    KPI values and operational context.
    """

    return generate_executive_recommendation(
        kpi_key=request.kpi_key,
        kpi_name=request.kpi_name,
        current_value=request.current_value,
        target_value=request.target_value,
        context=request.context,
    )
