from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import SessionLocal
from app.models.user import User
from app.services.kpi_calculation_service import (
    calculate_plant_score,
)
from app.services.tenant_service import (
    resolve_authenticated_tenant,
)


router = APIRouter(
    prefix="/api/plant",
    tags=["Plant"],
    dependencies=[
        Depends(get_current_user),
    ],
)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# TENANT RESOLUTION
# ============================================================

def resolve_plant_tenant(
    db: Session,
    current_user: User,
    requested_mine_name: str | None = None,
) -> dict:
    """
    Resolve the authenticated tenant for Plant analytics.

    The authenticated user's company assignment is the
    authoritative tenant-security boundary.

    requested_mine_name is retained only for frontend/API
    compatibility and is intentionally ignored for tenant
    selection. This prevents a stale or user-supplied mine_name
    query parameter from crossing tenant boundaries.
    """

    return resolve_authenticated_tenant(
        db=db,
        current_user=current_user,
    )


# ============================================================
# DISPLAY METADATA
# ============================================================

def build_plant_metadata(
    tenant: dict,
) -> dict:
    """
    Return operation-aware Plant labels while preserving the
    existing V1.0 response contract.

    SX-EW operations:
        Plant              -> Process Plant
        Throughput         -> Cathode Production
        Recovery           -> Cu Recovery

    Standard mines:
        Existing Plant terminology is preserved.
    """

    if (
        tenant.get("operation_profile")
        == "sxew_copper"
    ):
        return {
            "plant_label": "Process Plant",
            "throughput_label": (
                "Cathode Production"
            ),
            "recovery_label": "Cu Recovery",
            "throughput_unit": "t",
            "recovery_unit": "%",
        }

    return {
        "plant_label": "Plant",
        "throughput_label": "Throughput",
        "recovery_label": "Recovery",
        "throughput_unit": "t",
        "recovery_unit": "%",
    }


# ============================================================
# TODAY
# ============================================================

@router.get("/today")
def get_today_plant(
    mine_name: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return the latest available Plant record for the
    authenticated tenant.

    company_id + mine_id resolved from the authenticated
    tenant are the authoritative data-security boundary.

    The optional mine_name parameter is retained for frontend
    compatibility but cannot be used to cross tenant
    boundaries.
    """

    try:
        tenant = resolve_plant_tenant(
            db=db,
            current_user=current_user,
            requested_mine_name=mine_name,
        )

        metadata = build_plant_metadata(
            tenant
        )

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                throughput_plan,
                throughput_actual,
                recovery
            FROM public.plant_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT 1
            """
        )

        result = db.execute(
            query,
            {
                "company_id": tenant[
                    "company_id"
                ],
                "mine_id": tenant[
                    "mine_id"
                ],
            },
        ).mappings().first()

        if not result:
            return {
                "company_id": tenant[
                    "company_id"
                ],
                "mine_id": tenant[
                    "mine_id"
                ],
                "company_name": tenant[
                    "company_name"
                ],
                "mine_name": tenant[
                    "mine_name"
                ],
                "mine_type": tenant.get(
                    "mine_type"
                ),
                "operation_profile": (
                    tenant[
                        "operation_profile"
                    ]
                ),
                "applicability": tenant.get(
                    "applicability",
                    {},
                ),
                **metadata,
                "message": (
                    "No plant data found"
                ),
                "report_date": None,
                "throughput_plan": 0,
                "throughput_actual": 0,
                "throughput_performance": 0,
                "throughput_variance": 0,
                "recovery": 0,
                "plant_performance": 0,
            }

        throughput_plan = float(
            result["throughput_plan"]
            or 0
        )

        throughput_actual = float(
            result["throughput_actual"]
            or 0
        )

        recovery = float(
            result["recovery"]
            or 0
        )

        (
            plant_performance,
            throughput_performance,
            recovery,
        ) = calculate_plant_score(
            throughput_actual,
            throughput_plan,
            recovery,
        )

        throughput_variance = (
            throughput_actual
            - throughput_plan
        )

        return {
            "company_id": tenant[
                "company_id"
            ],
            "mine_id": tenant[
                "mine_id"
            ],
            "company_name": tenant[
                "company_name"
            ],
            "mine_name": tenant[
                "mine_name"
            ],
            "mine_type": tenant.get(
                "mine_type"
            ),
            "operation_profile": tenant[
                "operation_profile"
            ],
            "applicability": tenant.get(
                "applicability",
                {},
            ),
            **metadata,
            "report_date": str(
                result["report_date"]
            ),
            "throughput_plan": round(
                throughput_plan,
                1,
            ),
            "throughput_actual": round(
                throughput_actual,
                1,
            ),
            "throughput_performance": (
                round(
                    throughput_performance,
                    1,
                )
            ),
            "throughput_variance": round(
                throughput_variance,
                1,
            ),
            "recovery": round(
                recovery,
                2,
            ),
            "plant_performance": round(
                plant_performance,
                1,
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the latest "
                "plant data."
            ),
        ) from exc


# ============================================================
# TREND
# ============================================================

@router.get("/trend")
def get_plant_trend(
    mine_name: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    days: int = Query(
        default=30,
        ge=1,
        le=90,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return recent Plant records for the authenticated
    tenant in chronological order.

    company_id + mine_id resolved from the authenticated
    tenant are the tenant-security boundary.
    """

    try:
        tenant = resolve_plant_tenant(
            db=db,
            current_user=current_user,
            requested_mine_name=mine_name,
        )

        metadata = build_plant_metadata(
            tenant
        )

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                throughput_plan,
                throughput_actual,
                recovery
            FROM public.plant_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        )

        results = db.execute(
            query,
            {
                "company_id": tenant[
                    "company_id"
                ],
                "mine_id": tenant[
                    "mine_id"
                ],
                "days": days,
            },
        ).mappings().all()

        data = []

        for row in reversed(results):
            throughput_plan = float(
                row["throughput_plan"]
                or 0
            )

            throughput_actual = float(
                row["throughput_actual"]
                or 0
            )

            recovery = float(
                row["recovery"]
                or 0
            )

            (
                plant_performance,
                throughput_performance,
                recovery,
            ) = calculate_plant_score(
                throughput_actual,
                throughput_plan,
                recovery,
            )

            data.append(
                {
                    "company_id": tenant[
                        "company_id"
                    ],
                    "mine_id": tenant[
                        "mine_id"
                    ],
                    "company_name": tenant[
                        "company_name"
                    ],
                    "mine_name": tenant[
                        "mine_name"
                    ],
                    "mine_type": (
                        tenant.get(
                            "mine_type"
                        )
                    ),
                    "operation_profile": (
                        tenant[
                            "operation_profile"
                        ]
                    ),
                    "applicability": (
                        tenant.get(
                            "applicability",
                            {},
                        )
                    ),
                    **metadata,
                    "report_date": str(
                        row["report_date"]
                    ),
                    "throughput_plan": (
                        round(
                            throughput_plan,
                            1,
                        )
                    ),
                    "throughput_actual": (
                        round(
                            throughput_actual,
                            1,
                        )
                    ),
                    "throughput_performance": (
                        round(
                            throughput_performance,
                            1,
                        )
                    ),
                    "throughput_variance": (
                        round(
                            throughput_actual
                            - throughput_plan,
                            1,
                        )
                    ),
                    "recovery": round(
                        recovery,
                        2,
                    ),
                    "plant_performance": (
                        round(
                            plant_performance,
                            1,
                        )
                    ),
                }
            )

        return data

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the "
                "plant trend."
            ),
        ) from exc