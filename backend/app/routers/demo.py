from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import (
    BaseModel,
    Field,
)

from app.auth.dependencies import (
    get_current_user,
    require_administrator,
    require_general_manager_or_administrator,
)

from app.services.demo_data_service import (
    generate_all_demo_data,
)

from app.services.demo_persistence_service import (
    persist_demo_data,
)


# ============================================================
# Router
# ============================================================

router = APIRouter(
    prefix="/api/demo",
    tags=["Demo Mode"],
    dependencies=[
        Depends(
            get_current_user
        ),
    ],
)


# ============================================================
# Demo Defaults
# ============================================================

DEFAULT_DEMO_SCENARIO = (
    "High Performing Mine"
)

DEFAULT_DEMO_MINE_NAME = (
    "Achit Ikht LLC"
)


# ============================================================
# Request Models
# ============================================================

class DemoLoadRequest(
    BaseModel
):
    """
    Generate and persist a complete Mine Manager AI
    synthetic operating history.

    Default period:
        2021-01-01 -> today
    """

    scenario: str = Field(
        default=DEFAULT_DEMO_SCENARIO,
        min_length=1,
        max_length=100,
        description=(
            "Executive demo scenario name."
        ),
    )

    mine_name: str = Field(
        default=DEFAULT_DEMO_MINE_NAME,
        min_length=1,
        max_length=255,
        description=(
            "Configured mine or company used "
            "for Demo Mode."
        ),
    )


class DemoResetRequest(
    BaseModel
):
    """
    Optional context used when resetting Demo Mode.
    """

    mine_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description=(
            "Mine returning to live mode."
        ),
    )


# ============================================================
# Load Demo Data
# ============================================================

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
    Generate and persist the full Demo Mode dataset.

    Default synthetic history:
        2021-01-01 -> today

    Long-run synthetic targets:
        Production attainment        ~95%
        Plant throughput attainment  ~95%

    Persisted domains:
        Production
        Fleet
        Plant
        Safety

    General Manager or Administrator access is required.
    """

    normalized_scenario = (
        request.scenario.strip()
        or DEFAULT_DEMO_SCENARIO
    )

    normalized_mine_name = (
        request.mine_name.strip()
        or DEFAULT_DEMO_MINE_NAME
    )

    # --------------------------------------------------------
    # Generate complete synthetic history
    # --------------------------------------------------------

    try:
        demo_data = (
            generate_all_demo_data(
                scenario=
                    normalized_scenario,

                mine_name=
                    normalized_mine_name,

                days=None,
            )
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate Demo Mode "
                f"history: {exc}"
            ),
        ) from exc


    # --------------------------------------------------------
    # Persist synthetic history
    # --------------------------------------------------------

    try:
        persistence_result = (
            persist_demo_data(
                demo_data=
                    demo_data,

                mine_name=
                    normalized_mine_name,
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(
                exc
            ),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Demo history was generated but "
                "could not be persisted to "
                f"PostgreSQL: {exc}"
            ),
        ) from exc


    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    historical_start_date = (
        demo_data.get(
            "historical_start_date"
        )
    )

    historical_end_date = (
        demo_data.get(
            "historical_end_date"
        )
    )

    reporting_days = (
        demo_data.get(
            "reporting_days",
            0,
        )
    )

    generated_performance = (
        demo_data.get(
            "generated_performance",
            {},
        )
    )

    latest_30_day_performance = (
        demo_data.get(
            "latest_30_day_performance",
            {},
        )
    )


    # --------------------------------------------------------
    # Generated record counts
    # --------------------------------------------------------

    generated_record_counts = {
        "production":
            len(
                demo_data.get(
                    "production",
                    [],
                )
            ),

        "fleet":
            len(
                demo_data.get(
                    "fleet",
                    [],
                )
            ),

        "plant":
            len(
                demo_data.get(
                    "plant",
                    [],
                )
            ),

        "safety":
            len(
                demo_data.get(
                    "safety",
                    [],
                )
            ),

        "maintenance":
            len(
                demo_data.get(
                    "maintenance",
                    [],
                )
            ),

        "workforce":
            len(
                demo_data.get(
                    "workforce",
                    [],
                )
            ),
    }


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------
    #
    # Do NOT return the complete 2,000+ day dataset.
    #
    # The history is now persisted to PostgreSQL, so returning
    # thousands of rows to the browser is unnecessary.
    # --------------------------------------------------------

    return {
        "success":
            True,

        "message": (
            f"{normalized_scenario} synthetic "
            f"history generated and persisted "
            f"successfully for "
            f"{normalized_mine_name}"
        ),

        "scenario":
            normalized_scenario,

        "scenario_status":
            demo_data.get(
                "scenario_status"
            ),

        "requested_mine_name":
            normalized_mine_name,

        "tenant":
            persistence_result.get(
                "tenant",
                {},
            ),

        "synthetic_data":
            True,

        "historical_period": {
            "start_date":
                historical_start_date,

            "end_date":
                historical_end_date,

            "reporting_days":
                reporting_days,
        },

        "synthetic_targets":
            demo_data.get(
                "synthetic_targets",
                {},
            ),

        "generated_performance":
            generated_performance,

        "latest_30_day_performance":
            latest_30_day_performance,

        "generated_record_counts":
            generated_record_counts,

        "database_persistence":
            persistence_result,
    }


# ============================================================
# Reset Demo Mode
# ============================================================

@router.post(
    "/reset",
    dependencies=[
        Depends(
            require_administrator
        ),
    ],
)
def reset_demo_data(
    request: Optional[
        DemoResetRequest
    ] = None,
):
    """
    Reset the frontend Demo Mode state.

    IMPORTANT:
    This endpoint intentionally does NOT delete operational
    history from PostgreSQL.

    Historical data deletion should require a separate,
    explicit administrative operation.
    """

    mine_name = None

    if (
        request is not None
        and request.mine_name
        is not None
    ):
        normalized_name = (
            request.mine_name.strip()
        )

        if normalized_name:
            mine_name = (
                normalized_name
            )

    return {
        "success":
            True,

        "message":
            "Demo Mode reset successfully",

        "mine_name":
            mine_name,

        "database_records_deleted":
            False,

        "note": (
            "Demo Mode state was reset. "
            "Historical PostgreSQL operational "
            "records were retained."
        ),
    }