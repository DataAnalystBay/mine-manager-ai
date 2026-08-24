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
from app.models.user import User
from app.services.tenant_service import (
    resolve_authenticated_tenant,
)


router = APIRouter(
    prefix="/api/safety",
    tags=["Safety"],
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
# AUTHENTICATED TENANT RESOLUTION
# ============================================================

def resolve_safety_tenant(
    db: Session,
    current_user: User,
) -> dict:
    """
    Resolve the authenticated user's operational tenant.

    The authenticated user determines the company and mine.

    company_id + mine_id are the authoritative data boundary.

    The frontend must not determine the active tenant.
    """

    return resolve_authenticated_tenant(
        db=db,
        current_user=current_user,
    )


# ============================================================
# DISPLAY METADATA
# ============================================================

def build_safety_metadata(
    tenant: dict,
) -> dict:
    """
    Return operation-aware Safety labels.

    The current Safety KPI structure is shared between
    operation profiles, so these labels remain broadly
    applicable.
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
# TENANT RESPONSE HELPERS
# ============================================================

def build_tenant_response(
    tenant: dict,
    metadata: dict,
) -> dict:
    """
    Build common tenant metadata returned by Safety APIs.
    """

    return {
        "company_id": tenant["company_id"],
        "mine_id": tenant["mine_id"],
        "company_name": tenant["company_name"],
        "mine_name": tenant["mine_name"],
        "mine_type": tenant["mine_type"],
        "operation_profile": (
            tenant["operation_profile"]
        ),
        **metadata,
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
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return the latest Safety record for the
    authenticated tenant.

    The optional mine_name parameter is retained
    temporarily for backward frontend compatibility.

    It is NOT used to determine or authorize the tenant.

    The authenticated user determines the company
    and mine through resolve_authenticated_tenant().
    """

    try:
        tenant = resolve_safety_tenant(
            db=db,
            current_user=current_user,
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
                    tenant["company_id"]
                ),
                "mine_id": (
                    tenant["mine_id"]
                ),
            },
        ).mappings().first()

        tenant_response = (
            build_tenant_response(
                tenant=tenant,
                metadata=metadata,
            )
        )

        if not result:
            return {
                **tenant_response,
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
            **tenant_response,
            "report_date": str(
                result["report_date"]
            ),
            "incidents": int(
                result["incidents"]
                or 0
            ),
            "near_misses": int(
                result["near_misses"]
                or 0
            ),
            "critical_risks": int(
                result["critical_risks"]
                or 0
            ),
            "safety_score": round(
                float(
                    result["safety_score"]
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
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return recent Safety records for the
    authenticated tenant in chronological order.

    company_id + mine_id are the authoritative
    tenant-security boundary.

    The optional mine_name parameter is retained
    temporarily for backward frontend compatibility.

    It cannot change the authenticated tenant.
    """

    try:
        tenant = resolve_safety_tenant(
            db=db,
            current_user=current_user,
        )

        metadata = build_safety_metadata(
            tenant
        )

        tenant_response = (
            build_tenant_response(
                tenant=tenant,
                metadata=metadata,
            )
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
                    tenant["company_id"]
                ),
                "mine_id": (
                    tenant["mine_id"]
                ),
                "days": days,
            },
        ).mappings().all()

        data = []

        for row in reversed(results):
            data.append(
                {
                    **tenant_response,
                    "report_date": str(
                        row["report_date"]
                    ),
                    "incidents": int(
                        row["incidents"]
                        or 0
                    ),
                    "near_misses": int(
                        row["near_misses"]
                        or 0
                    ),
                    "critical_risks": int(
                        row["critical_risks"]
                        or 0
                    ),
                    "safety_score": round(
                        float(
                            row["safety_score"]
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