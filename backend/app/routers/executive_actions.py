from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status as http_status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    require_mine_management,
    require_operational_editor,
)
from app.database import get_db
from app.models.user import User

from app.schemas.executive_action import (
    ExecutiveActionAnalytics,
    ExecutiveActionCreate,
    ExecutiveActionResponse,
    ExecutiveActionStatusUpdate,
    ExecutiveActionSummary,
    ExecutiveActionUpdate,
)
from app.schemas.kpi_context import (
    LiveKpiContextResponse,
)

from app.services.executive_action_service import (
    create_action,
    delete_action,
    get_action_analytics,
    get_action_by_id,
    get_action_by_key,
    get_action_summary,
    list_actions,
    update_action,
    update_action_status,
)
from app.services.kpi_context_service import (
    get_live_kpi_context,
)
from app.services.tenant_service import (
    resolve_authenticated_tenant,
)


router = APIRouter(
    prefix="/api/executive-actions",
    tags=["Executive Actions"],
    dependencies=[
        Depends(get_current_user),
    ],
)


VALID_STATUSES = {
    "open",
    "in_progress",
    "completed",
    "blocked",
}

VALID_PRIORITIES = {
    "low",
    "medium",
    "high",
    "critical",
}


# ============================================================
# TENANT HELPER
# ============================================================

def _resolve_tenant(
    db: Session,
    current_user: User,
) -> dict:
    """
    Resolve the operational tenant belonging to the
    authenticated user.

    company_id and mine_id are always determined by the
    backend. They are never accepted from frontend requests.
    """

    return resolve_authenticated_tenant(
        db=db,
        current_user=current_user,
    )


# ============================================================
# CREATE EXECUTIVE ACTION
# ============================================================

@router.post(
    "",
    response_model=ExecutiveActionResponse,
    status_code=http_status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_operational_editor),
    ],
)
def create_executive_action(
    action_data: ExecutiveActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Create a new Executive Action for the authenticated
    tenant.

    Allowed roles:
    - Superintendent
    - Mine Manager
    - General Manager
    - Administrator
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    existing_action = get_action_by_key(
        db=db,
        action_key=action_data.action_key,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if existing_action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_409_CONFLICT
            ),
            detail=(
                "An executive action with this "
                "action_key already exists for "
                "the active mine."
            ),
        )

    try:
        return create_action(
            db=db,
            action_data=action_data,
            company_id=tenant["company_id"],
            mine_id=tenant["mine_id"],
        )

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                http_status.HTTP_409_CONFLICT
            ),
            detail=(
                "An executive action with this "
                "action_key already exists for "
                "the active mine."
            ),
        ) from exc


# ============================================================
# LIST EXECUTIVE ACTIONS
# ============================================================

@router.get(
    "",
    response_model=list[
        ExecutiveActionResponse
    ],
)
def get_executive_actions(
    status: Optional[str] = Query(
        default=None
    ),
    priority: Optional[str] = Query(
        default=None
    ),
    kpi_key: Optional[str] = Query(
        default=None
    ),
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return Executive Actions belonging only to the
    authenticated tenant.

    All authenticated roles may view actions.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    normalized_status = None
    normalized_priority = None
    normalized_kpi_key = None

    if status:
        normalized_status = (
            status.strip()
            .lower()
            .replace(
                " ",
                "_",
            )
        )

        if (
            normalized_status
            not in VALID_STATUSES
        ):
            raise HTTPException(
                status_code=(
                    http_status
                    .HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Invalid status. Use open, "
                    "in_progress, completed, "
                    "or blocked."
                ),
            )

    if priority:
        normalized_priority = (
            priority.strip()
            .lower()
            .replace(
                " ",
                "_",
            )
        )

        if (
            normalized_priority
            not in VALID_PRIORITIES
        ):
            raise HTTPException(
                status_code=(
                    http_status
                    .HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Invalid priority. Use low, "
                    "medium, high, or critical."
                ),
            )

    if kpi_key:
        normalized_kpi_key = (
            kpi_key.strip()
            .lower()
            .replace(
                " ",
                "_",
            )
        )

    return list_actions(
        db=db,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
        status=normalized_status,
        priority=normalized_priority,
        kpi_key=normalized_kpi_key,
        skip=skip,
        limit=limit,
    )


# ============================================================
# EXECUTIVE ACTION SUMMARY
# ============================================================

@router.get(
    "/summary",
    response_model=ExecutiveActionSummary,
)
def get_executive_actions_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return Executive Action summary metrics for the
    authenticated tenant only.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    return get_action_summary(
        db=db,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )


# ============================================================
# EXECUTIVE ACTION ANALYTICS
# ============================================================

@router.get(
    "/analytics",
    response_model=ExecutiveActionAnalytics,
)
def get_executive_actions_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return Executive Action analytics for the
    authenticated tenant only.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    return get_action_analytics(
        db=db,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )


# ============================================================
# ACTION BY KEY
# ============================================================

@router.get(
    "/by-key/{action_key}",
    response_model=ExecutiveActionResponse,
)
def get_executive_action_by_key(
    action_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return one Executive Action by action key inside the
    authenticated tenant.

    An action belonging to another tenant returns 404.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    action = get_action_by_key(
        db=db,
        action_key=action_key,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if not action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Executive action not found."
            ),
        )

    return action


# ============================================================
# ACTION KPI CONTEXT
# ============================================================

@router.get(
    "/{action_id}/kpi-context",
    response_model=LiveKpiContextResponse,
)
def get_executive_action_kpi_context(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return live KPI Context for an Executive Action.

    Security:
        The action must belong to the authenticated tenant.

    KPI values:
        Loaded through tenant-aware shared analytics.

    Related actions:
        Restricted to the same company and mine.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    action = get_action_by_id(
        db=db,
        action_id=action_id,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if not action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Executive action not found."
            ),
        )

    context = get_live_kpi_context(
        db=db,
        kpi_key=action.kpi_key,
        kpi_name=action.kpi_name,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
        mine_name=tenant["mine_name"],
        operation_profile=tenant[
            "operation_profile"
        ],
        current_action_id=action.id,
    )

    if not context:
        return {
            "linked": False,
            "message": (
                "No live KPI context is available "
                "for this executive action."
            ),
            "context": None,
        }

    return {
        "linked": True,
        "message": (
            "Live KPI context loaded successfully."
        ),
        "context": context,
    }


# ============================================================
# ACTION BY ID
# ============================================================

@router.get(
    "/{action_id}",
    response_model=ExecutiveActionResponse,
)
def get_executive_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return one Executive Action belonging to the
    authenticated tenant.

    An action belonging to another tenant returns 404.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    action = get_action_by_id(
        db=db,
        action_id=action_id,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if not action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Executive action not found."
            ),
        )

    return action


# ============================================================
# UPDATE EXECUTIVE ACTION
# ============================================================

@router.patch(
    "/{action_id}",
    response_model=ExecutiveActionResponse,
    dependencies=[
        Depends(require_operational_editor),
    ],
)
def update_executive_action(
    action_id: int,
    action_data: ExecutiveActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Update an Executive Action belonging to the
    authenticated tenant.

    Allowed roles:
    - Superintendent
    - Mine Manager
    - General Manager
    - Administrator
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    action = get_action_by_id(
        db=db,
        action_id=action_id,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if not action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Executive action not found."
            ),
        )

    return update_action(
        db=db,
        action=action,
        action_data=action_data,
    )


# ============================================================
# UPDATE ACTION STATUS
# ============================================================

@router.patch(
    "/{action_id}/status",
    response_model=ExecutiveActionResponse,
    dependencies=[
        Depends(require_operational_editor),
    ],
)
def change_executive_action_status(
    action_id: int,
    status_data: ExecutiveActionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Change status for an Executive Action belonging to the
    authenticated tenant.

    Allowed roles:
    - Superintendent
    - Mine Manager
    - General Manager
    - Administrator
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    action = get_action_by_id(
        db=db,
        action_id=action_id,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if not action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Executive action not found."
            ),
        )

    return update_action_status(
        db=db,
        action=action,
        status=status_data.status,
    )


# ============================================================
# DELETE EXECUTIVE ACTION
# ============================================================

@router.delete(
    "/{action_id}",
    status_code=(
        http_status.HTTP_204_NO_CONTENT
    ),
    dependencies=[
        Depends(require_mine_management),
    ],
)
def remove_executive_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Permanently delete an Executive Action belonging to the
    authenticated tenant.

    Allowed roles:
    - Mine Manager
    - General Manager
    - Administrator
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    action = get_action_by_id(
        db=db,
        action_id=action_id,
        company_id=tenant["company_id"],
        mine_id=tenant["mine_id"],
    )

    if not action:
        raise HTTPException(
            status_code=(
                http_status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Executive action not found."
            ),
        )

    delete_action(
        db=db,
        action=action,
    )

    return Response(
        status_code=(
            http_status.HTTP_204_NO_CONTENT
        )
    )