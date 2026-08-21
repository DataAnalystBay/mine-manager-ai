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

from app.auth.dependencies import (
    get_current_user,
)
from app.database import SessionLocal


router = APIRouter(
    prefix="/api/safety",
    tags=["Safety"],
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

def build_safety_metadata(
    tenant: dict,
):
    """
    Return operation-aware Safety labels.

    Current Safety KPI structure is shared between operation types,
    so these labels remain broadly applicable.
    """

    if (
        tenant["operation_profile"]
        == "sxew_copper"
    ):
        return {
            "safety_label": "Safety",
            "incident_label": "Incidents",
            "near_miss_label": "Near Misses",
            "critical_risk_label": "Critical Risks",
            "safety_score_label": "Safety Score",
        }

    return {
        "safety_label": "Safety",
        "incident_label": "Incidents",
        "near_miss_label": "Near Misses",
        "critical_risk_label": "Critical Risks",
        "safety_score_label": "Safety Score",
    }


# ============================================================
# TODAY
# ============================================================

@router.get("/today")
def get_today_safety(
    mine_name: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    db: Session = Depends(get_db),
):
    """
    Return the latest Safety record for the active tenant.

    The optional mine_name parameter is accepted only for
    frontend compatibility. It is not used as the security boundary.
    """

    try:
        tenant = resolve_active_tenant(
            db=db,
        )

        metadata = build_safety_metadata(
            tenant
        )

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM public.safety_daily
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
                    "No safety data found"
                ),
                "report_date": None,
                "incidents": 0,
                "near_misses": 0,
                "critical_risks": 0,
                "safety_score": 0,
            }

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
            "incidents": int(
                result[
                    "incidents"
                ]
                or 0
            ),
            "near_misses": int(
                result[
                    "near_misses"
                ]
                or 0
            ),
            "critical_risks": int(
                result[
                    "critical_risks"
                ]
                or 0
            ),
            "safety_score": round(
                float(
                    result[
                        "safety_score"
                    ]
                    or 0
                ),
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
                "safety data."
            ),
        ) from exc


# ============================================================
# TREND
# ============================================================

@router.get("/trend")
def get_safety_trend(
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
    Return recent Safety records for the active tenant
    in chronological order.

    company_id + mine_id are the tenant-security boundary.
    """

    try:
        tenant = resolve_active_tenant(
            db=db,
        )

        metadata = build_safety_metadata(
            tenant
        )

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM public.safety_daily
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
                    "incidents": int(
                        row[
                            "incidents"
                        ]
                        or 0
                    ),
                    "near_misses": int(
                        row[
                            "near_misses"
                        ]
                        or 0
                    ),
                    "critical_risks": int(
                        row[
                            "critical_risks"
                        ]
                        or 0
                    ),
                    "safety_score": round(
                        float(
                            row[
                                "safety_score"
                            ]
                            or 0
                        ),
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
                "safety trend."
            ),
        ) from exc