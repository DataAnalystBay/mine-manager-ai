from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth.dependencies import (
    get_current_user,
    require_administrator,
    require_general_manager_or_administrator,
)
from app.services.demo_data_service import (
    generate_all_demo_data,
)


router = APIRouter(
    prefix="/api/demo",
    tags=["Demo Mode"],
    dependencies=[
        Depends(get_current_user),
    ],
)


class DemoLoadRequest(BaseModel):
    """
    Request payload used to generate an executive
    demo scenario.
    """

    scenario: str = Field(
        default="High Performing Mine",
        min_length=1,
        max_length=100,
        description="Executive demo scenario name.",
    )

    mine_name: str = Field(
        default="Oyu Tolgoi Surface",
        min_length=1,
        max_length=255,
        description="Mine name used by the demo.",
    )


class DemoResetRequest(BaseModel):
    """
    Optional context used when resetting Demo Mode.
    """

    mine_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Mine returning to live mode.",
    )


@router.post(
    "/load",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def load_demo_data(
    request: DemoLoadRequest,
):
    """
    Generate demo data for the selected scenario
    and mine.

    General Manager or Administrator access is required.
    """

    normalized_scenario = request.scenario.strip()
    normalized_mine_name = request.mine_name.strip()

    demo_data = generate_all_demo_data(
        scenario=normalized_scenario,
        mine_name=normalized_mine_name,
    )

    return {
        "success": True,
        "message": (
            f"{normalized_scenario} demo scenario generated "
            f"successfully for {normalized_mine_name}"
        ),
        "scenario": normalized_scenario,
        "mine_name": normalized_mine_name,
        "data": demo_data,
    }


@router.post(
    "/reset",
    dependencies=[
        Depends(require_administrator),
    ],
)
def reset_demo_data(
    request: Optional[DemoResetRequest] = None,
):
    """
    Reset the frontend Demo Mode state.

    This endpoint does not currently remove
    PostgreSQL operational records.

    Administrator access is required.
    """

    mine_name = None

    if (
        request is not None
        and request.mine_name is not None
    ):
        mine_name = request.mine_name.strip()

    return {
        "success": True,
        "message": "Demo Mode reset successfully",
        "mine_name": mine_name,
    }