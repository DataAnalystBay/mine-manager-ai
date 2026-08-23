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
from app.services.tenant_service import resolve_authenticated_tenant


router = APIRouter(
    prefix="/api/fleet",
    tags=["Fleet"],
    dependencies=[
        Depends(get_current_user),
    ],
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
# AUTHENTICATED TENANT RESOLUTION
# ============================================================

def resolve_active_tenant(
    db: Session,
    current_user: User,
):
    """
    Resolve the operational tenant from the authenticated user.

    Security boundary:
        authenticated user
            -> auth company
            -> operational company
            -> operational mine

    Fleet queries must use company_id + mine_id.
    """

    return resolve_authenticated_tenant(
        db=db,
        current_user=current_user,
    )


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
    current_user: User = Depends(
        get_current_user
    ),
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
            current_user=current_user,
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
    current_user: User = Depends(
        get_current_user
    ),
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
            current_user=current_user,
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