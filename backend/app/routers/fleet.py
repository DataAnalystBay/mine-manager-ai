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


router = APIRouter(
    prefix="/api/fleet",
    tags=["Fleet"],
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
    """
    Provide a database session and close it after the request.
    """

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

    ACTIVE_COMPANY_ID + ACTIVE_MINE_ID are the authoritative
    V1.0 tenant boundary.

    Operational queries must not rely on mine_name alone.
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
        "fleet_applicable": (
            not is_sxew_operation
        ),
    }


# ============================================================
# DISPLAY METADATA
# ============================================================

def build_fleet_metadata(
    tenant: dict,
):
    """
    Return operation-aware Fleet metadata.

    SX-EW copper processing:
        Fleet analytics are not part of the current V1.0
        operational KPI model.

    Standard mine:
        Fleet availability, utilization, and combined Fleet
        performance remain applicable.
    """

    if (
        tenant["operation_profile"]
        == "sxew_copper"
    ):
        return {
            "fleet_applicable": False,
            "data_status": "Not Applicable",
            "fleet_label": "Fleet Analytics",
            "availability_label": "Availability",
            "utilization_label": "Utilization",
            "fleet_performance_label": (
                "Fleet Performance"
            ),
            "not_applicable_reason": (
                "Fleet analytics are not enabled for "
                "this SX-EW copper processing operation."
            ),
        }

    return {
        "fleet_applicable": True,
        "data_status": "Available",
        "fleet_label": "Fleet Performance",
        "availability_label": "Availability",
        "utilization_label": "Utilization",
        "fleet_performance_label": (
            "Fleet Performance"
        ),
        "not_applicable_reason": None,
    }


# ============================================================
# TODAY
# ============================================================

@router.get("/today")
def get_today_fleet(
    mine_name: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    db: Session = Depends(get_db),
):
    """
    Return the latest available Fleet record for the active
    tenant.

    Tenant isolation is enforced through:
        company_id + mine_id

    mine_name is accepted for backward compatibility only.
    The active tenant remains authoritative.

    For operation profiles where Fleet is not applicable,
    return an explicit Not Applicable state instead of
    misleading zero-performance KPIs.
    """

    try:
        tenant = resolve_active_tenant(
            db=db,
        )

        metadata = build_fleet_metadata(
            tenant
        )

        # ----------------------------------------------------
        # OPERATION PROFILE DOES NOT USE FLEET ANALYTICS
        # ----------------------------------------------------

        if not metadata[
            "fleet_applicable"
        ]:
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
                "report_date": None,
                "availability": None,
                "utilization": None,
                "fleet_performance": None,
            }

        # ----------------------------------------------------
        # STANDARD FLEET QUERY
        # ----------------------------------------------------

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                availability,
                utilization
            FROM public.fleet_daily
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
                "data_status": "No Data",
                "message": (
                    "No fleet data found"
                ),
                "report_date": None,
                "availability": None,
                "utilization": None,
                "fleet_performance": None,
            }

        availability = float(
            result["availability"] or 0
        )

        utilization = float(
            result["utilization"] or 0
        )

        fleet_performance = round(
            (
                availability
                + utilization
            )
            / 2,
            1,
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
            "availability": round(
                availability,
                1,
            ),
            "utilization": round(
                utilization,
                1,
            ),
            "fleet_performance": (
                fleet_performance
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
                "fleet data."
            ),
        ) from exc


# ============================================================
# TREND
# ============================================================

@router.get("/trend")
def get_fleet_trend(
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
    Return recent Fleet records for the active tenant in
    chronological order.

    company_id + mine_id provide the tenant-security boundary.

    If Fleet is not applicable to the active operation
    profile, an empty trend is returned.
    """

    try:
        tenant = resolve_active_tenant(
            db=db,
        )

        metadata = build_fleet_metadata(
            tenant
        )

        # ----------------------------------------------------
        # OPERATION PROFILE DOES NOT USE FLEET ANALYTICS
        # ----------------------------------------------------

        if not metadata[
            "fleet_applicable"
        ]:
            return []

        # ----------------------------------------------------
        # STANDARD FLEET TREND
        # ----------------------------------------------------

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                availability,
                utilization
            FROM public.fleet_daily
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
            availability = float(
                row[
                    "availability"
                ]
                or 0
            )

            utilization = float(
                row[
                    "utilization"
                ]
                or 0
            )

            fleet_performance = round(
                (
                    availability
                    + utilization
                )
                / 2,
                1,
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
                    "availability": round(
                        availability,
                        1,
                    ),
                    "utilization": round(
                        utilization,
                        1,
                    ),
                    "fleet_performance": (
                        fleet_performance
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
                "fleet trend."
            ),
        ) from exc