from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_db,
    require_administrator,
)
from app.models import User
from app.models.audit_log import AuditLog
from app.services.audit_excel_service import (
    EXCEL_MEDIA_TYPE,
    generate_audit_trail_excel,
)


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Trail"],
)


# ============================================================
# Response schemas
# ============================================================

class AuditLogItem(BaseModel):
    id: int
    company_id: int

    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None

    action: str
    entity_type: str
    entity_id: Optional[int] = None
    entity_name: Optional[str] = None

    description: Optional[str] = None
    status: str
    ip_address: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: List[AuditLogItem]

    total: int
    page: int
    page_size: int
    total_pages: int

    total_logs: int
    successful_logs: int
    failed_logs: int
    today_logs: int


# ============================================================
# Shared filter helper
# ============================================================

def apply_audit_log_filters(
    query,
    *,
    search: Optional[str] = None,
    action: Optional[str] = None,
    actor_email: Optional[str] = None,
    entity_type: Optional[str] = None,
    status_value: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    if search:
        search_value = search.strip()

        if search_value:
            search_pattern = f"%{search_value}%"

            query = query.filter(
                or_(
                    AuditLog.actor_name.ilike(
                        search_pattern
                    ),
                    AuditLog.actor_email.ilike(
                        search_pattern
                    ),
                    AuditLog.action.ilike(
                        search_pattern
                    ),
                    AuditLog.entity_type.ilike(
                        search_pattern
                    ),
                    AuditLog.entity_name.ilike(
                        search_pattern
                    ),
                    AuditLog.description.ilike(
                        search_pattern
                    ),
                    AuditLog.status.ilike(
                        search_pattern
                    ),
                    AuditLog.ip_address.ilike(
                        search_pattern
                    ),
                )
            )

    if action:
        action_value = action.strip()

        if action_value:
            query = query.filter(
                AuditLog.action == action_value
            )

    if actor_email:
        actor_email_value = actor_email.strip()

        if actor_email_value:
            query = query.filter(
                AuditLog.actor_email.ilike(
                    actor_email_value
                )
            )

    if entity_type:
        entity_type_value = entity_type.strip()

        if entity_type_value:
            query = query.filter(
                AuditLog.entity_type.ilike(
                    entity_type_value
                )
            )

    if status_value:
        normalized_status = status_value.strip()

        if normalized_status:
            query = query.filter(
                AuditLog.status.ilike(
                    normalized_status
                )
            )

    if start_date:
        query = query.filter(
            AuditLog.created_at >= start_date
        )

    if end_date:
        query = query.filter(
            AuditLog.created_at <= end_date
        )

    return query


# ============================================================
# Excel export
# ============================================================

@router.get("/export/excel")
def export_audit_logs_excel(
    search: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=255,
        description=(
            "Search actor name, actor email, action, "
            "entity name, entity type, description, "
            "status, or IP address."
        ),
    ),
    action: Optional[str] = Query(
        default=None,
        max_length=100,
        description="Filter by exact audit action.",
    ),
    actor_email: Optional[str] = Query(
        default=None,
        max_length=255,
        description="Filter by actor email.",
    ),
    entity_type: Optional[str] = Query(
        default=None,
        max_length=100,
        description="Filter by entity type.",
    ),
    status: Optional[str] = Query(
        default=None,
        max_length=50,
        description="Filter by audit status.",
    ),
    start_date: Optional[datetime] = Query(
        default=None,
        description=(
            "Export records created on or after this datetime."
        ),
    ),
    end_date: Optional[datetime] = Query(
        default=None,
        description=(
            "Export records created on or before this datetime."
        ),
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    query = (
        db.query(AuditLog)
        .filter(
            AuditLog.company_id
            == current_user.company_id
        )
    )

    query = apply_audit_log_filters(
        query,
        search=search,
        action=action,
        actor_email=actor_email,
        entity_type=entity_type,
        status_value=status,
        start_date=start_date,
        end_date=end_date,
    )

    audit_logs = (
        query
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .all()
    )

    company_name = "Mine Manager AI"

    if current_user.company is not None:
        company_name = (
            getattr(
                current_user.company,
                "company_name",
                None,
            )
            or getattr(
                current_user.company,
                "name",
                None,
            )
            or "Mine Manager AI"
        )

    generated_by = (
        current_user.full_name
        or current_user.email
        or "Administrator"
    )

    buffer = generate_audit_trail_excel(
        audit_logs=audit_logs,
        company_name=company_name,
        generated_by=generated_by,
    )

    filename = (
        "Mine_Manager_AI_Audit_Trail_"
        f"{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}"
        ".xlsx"
    )

    return StreamingResponse(
        buffer,
        media_type=EXCEL_MEDIA_TYPE,
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )


# ============================================================
# List audit logs
# ============================================================

@router.get(
    "",
    response_model=AuditLogListResponse,
)
def list_audit_logs(
    search: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=255,
        description=(
            "Search actor name, actor email, action, "
            "entity name, entity type, description, "
            "status, or IP address."
        ),
    ),
    action: Optional[str] = Query(
        default=None,
        max_length=100,
        description="Filter by exact audit action.",
    ),
    actor_email: Optional[str] = Query(
        default=None,
        max_length=255,
        description="Filter by actor email.",
    ),
    entity_type: Optional[str] = Query(
        default=None,
        max_length=100,
        description="Filter by entity type.",
    ),
    status: Optional[str] = Query(
        default=None,
        max_length=50,
        description="Filter by audit status.",
    ),
    start_date: Optional[datetime] = Query(
        default=None,
        description=(
            "Return records created on or after this datetime."
        ),
    ),
    end_date: Optional[datetime] = Query(
        default=None,
        description=(
            "Return records created on or before this datetime."
        ),
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_administrator),
):
    company_filter = (
        AuditLog.company_id
        == current_user.company_id
    )

    query = (
        db.query(AuditLog)
        .filter(company_filter)
    )

    total_logs = (
        db.query(func.count(AuditLog.id))
        .filter(company_filter)
        .scalar()
        or 0
    )

    successful_logs = (
        db.query(func.count(AuditLog.id))
        .filter(
            company_filter,
            func.upper(AuditLog.status)
            == "SUCCESS",
        )
        .scalar()
        or 0
    )

    failed_logs = (
        db.query(func.count(AuditLog.id))
        .filter(
            company_filter,
            func.upper(AuditLog.status)
            == "FAILED",
        )
        .scalar()
        or 0
    )

    today_utc = datetime.now(
        timezone.utc
    ).date()

    today_logs = (
        db.query(func.count(AuditLog.id))
        .filter(
            company_filter,
            func.date(AuditLog.created_at)
            == today_utc,
        )
        .scalar()
        or 0
    )

    query = apply_audit_log_filters(
        query,
        search=search,
        action=action,
        actor_email=actor_email,
        entity_type=entity_type,
        status_value=status,
        start_date=start_date,
        end_date=end_date,
    )

    total = query.count()

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    offset = (page - 1) * page_size

    items = (
        query
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "total_logs": total_logs,
        "successful_logs": successful_logs,
        "failed_logs": failed_logs,
        "today_logs": today_logs,
    }