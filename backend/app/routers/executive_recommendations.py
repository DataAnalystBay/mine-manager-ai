from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import (
    get_current_user,
    require_operational_editor,
)
from app.services.executive_recommendation.recommendation_engine import (
    generate_executive_recommendation,
)


router = APIRouter(
    prefix="/api/executive-recommendations",
    tags=["Executive Recommendations"],
    dependencies=[
        Depends(get_current_user),
    ],
)


class ExecutiveRecommendationRequest(BaseModel):
    kpi_key: str = Field(
        ...,
        min_length=1,
        max_length=100,
        examples=["ore_production"],
    )

    kpi_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
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
    Return a deterministic executive recommendation.

    All authenticated users may access this endpoint.
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


@router.post(
    "/generate",
    dependencies=[
        Depends(require_operational_editor),
    ],
)
def generate_recommendation(
    request: ExecutiveRecommendationRequest,
):
    """
    Generate an executive recommendation.

    Allowed roles:
    - Superintendent
    - Mine Manager
    - General Manager
    - Administrator
    """

    return generate_executive_recommendation(
        kpi_key=request.kpi_key.strip(),
        kpi_name=request.kpi_name.strip(),
        current_value=request.current_value,
        target_value=request.target_value,
        context=request.context or {},
    )