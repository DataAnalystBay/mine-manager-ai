import os

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
from app.services.kpi_calculation_service import calculate_plant_score


router = APIRouter(
    prefix="/api/plant",
    tags=["Plant"],
    dependencies=[
        Depends(get_current_user),
    ],
)


ACTIVE_COMPANY_ID = int(
    os.getenv(
        "ACTIVE_COMPANY_ID",
        "1",
    )
)

ACTIVE_MINE_ID = int(
    os.getenv(
        "ACTIVE_MINE_ID",
        "1",
    )
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
# ACTIVE TENANT RESOLUTION
# ============================================================

def resolve_active_tenant(
    db: Session,
):
    """
    Resolve the active company and mine.

    company_id + mine_id are the authoritative tenant boundary.
    """

    tenant = db.execute(
        text(
            """
            SELECT
                m.id AS mine_id,
                m.company_id AS company_id,
                m.mine_name AS mine_name,
                m.mine_type AS mine_type,
                c.company_name AS company_name
            FROM public.mine_settings AS m
            JOIN public.company_settings AS c
                ON c.id = m.company_id
            WHERE m.id = :mine_id
              AND m.company_id = :company_id
            """
        ),
        {
            "company_id": ACTIVE_COMPANY_ID,
            "mine_id": ACTIVE_MINE_ID,
        },
    ).mappings().first()

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Active tenant was not found: "
                f"company_id={ACTIVE_COMPANY_ID}, "
                f"mine_id={ACTIVE_MINE_ID}"
            ),
        )

    mine_type = str(
        tenant["mine_type"] or ""
    ).strip().lower()

    is_sxew_operation = (
        mine_type
        in {
            "processing plant / sx-ew",
            "sx-ew",
            "hydrometallurgical copper processing",
        }
        or tenant["mine_name"]
        == "Achit-Ikht Copper Cathode Operation"
    )

    return {
        "company_id": int(
            tenant["company_id"]
        ),
        "mine_id": int(
            tenant["mine_id"]
        ),
        "company_name": tenant[
            "company_name"
        ],
        "mine_name": tenant[
            "mine_name"
        ],
        "mine_type": tenant[
            "mine_type"
        ],
        "operation_profile": (
            "sxew_copper"
            if is_sxew_operation
            else "standard_mine"
        ),
    }


# ============================================================
# DISPLAY METADATA
# ============================================================

def build_plant_metadata(
    tenant: dict,
):
    """
    Return operation-aware labels while preserving the
    current V1.0 response fields.
    """

    if (
        tenant["operation_profile"]
        == "sxew_copper"
    ):
        return {
            "plant_label": (
                "Process Plant"
            ),
            "throughput_label": (
                "Cathode Production"
            ),
            "recovery_label": (
                "Cu Recovery"
            ),
            "throughput_unit": "t",
            "recovery_unit": "%",
        }

    return {
        "plant_label": (
            "Plant"
        ),
        "throughput_label": (
            "Throughput"
        ),
        "recovery_label": (
            "Recovery"
        ),
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
):
    """
    Return the latest available Plant record for the
    active tenant.

    The optional mine_name parameter is accepted only for
    frontend compatibility and is not used as the security
    boundary.
    """

    try:
        tenant = resolve_active_tenant(
            db=db,
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
                "company_id": (
                    tenant[
                        "company_id"
                    ]
                ),
                "mine_id": (
                    tenant[
                        "mine_id"
                    ]
                ),
            },
        ).mappings().first()

        if not result:
            return {
                "company_id": (
                    tenant[
                        "company_id"
                    ]
                ),
                "mine_id": (
                    tenant[
                        "mine_id"
                    ]
                ),
                "company_name": (
                    tenant[
                        "company_name"
                    ]
                ),
                "mine_name": (
                    tenant[
                        "mine_name"
                    ]
                ),
                "mine_type": (
                    tenant[
                        "mine_type"
                    ]
                ),
                "operation_profile": (
                    tenant[
                        "operation_profile"
                    ]
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
            result[
                "throughput_plan"
            ]
            or 0
        )

        throughput_actual = float(
            result[
                "throughput_actual"
            ]
            or 0
        )

        recovery = float(
            result[
                "recovery"
            ]
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
            "company_id": (
                tenant[
                    "company_id"
                ]
            ),
            "mine_id": (
                tenant[
                    "mine_id"
                ]
            ),
            "company_name": (
                tenant[
                    "company_name"
                ]
            ),
            "mine_name": (
                tenant[
                    "mine_name"
                ]
            ),
            "mine_type": (
                tenant[
                    "mine_type"
                ]
            ),
            "operation_profile": (
                tenant[
                    "operation_profile"
                ]
            ),
            **metadata,
            "report_date": str(
                result[
                    "report_date"
                ]
            ),
            "throughput_plan": round(
                throughput_plan,
                1,
            ),
            "throughput_actual": round(
                throughput_actual,
                1,
            ),
            "throughput_performance": round(
                throughput_performance,
                1,
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
):
    """
    Return recent Plant records for the active tenant
    in chronological order.

    company_id + mine_id are the tenant-security boundary.
    """

    try:
        tenant = resolve_active_tenant(
            db=db,
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
                "company_id": (
                    tenant[
                        "company_id"
                    ]
                ),
                "mine_id": (
                    tenant[
                        "mine_id"
                    ]
                ),
                "days": days,
            },
        ).mappings().all()

        data = []

        for row in reversed(
            results
        ):
            throughput_plan = float(
                row[
                    "throughput_plan"
                ]
                or 0
            )

            throughput_actual = float(
                row[
                    "throughput_actual"
                ]
                or 0
            )

            recovery = float(
                row[
                    "recovery"
                ]
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
                    "company_id": (
                        tenant[
                            "company_id"
                        ]
                    ),
                    "mine_id": (
                        tenant[
                            "mine_id"
                        ]
                    ),
                    "company_name": (
                        tenant[
                            "company_name"
                        ]
                    ),
                    "mine_name": (
                        tenant[
                            "mine_name"
                        ]
                    ),
                    "mine_type": (
                        tenant[
                            "mine_type"
                        ]
                    ),
                    "operation_profile": (
                        tenant[
                            "operation_profile"
                        ]
                    ),
                    **metadata,
                    "report_date": str(
                        row[
                            "report_date"
                        ]
                    ),
                    "throughput_plan": round(
                        throughput_plan,
                        1,
                    ),
                    "throughput_actual": round(
                        throughput_actual,
                        1,
                    ),
                    "throughput_performance": round(
                        throughput_performance,
                        1,
                    ),
                    "throughput_variance": round(
                        throughput_actual
                        - throughput_plan,
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