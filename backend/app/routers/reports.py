import logging

from datetime import datetime
from io import BytesIO
from typing import Callable, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    require_mine_management,
    require_operational_editor,
)
from app.database import get_db
from app.models import User

from app.services.excel_service import (
    generate_executive_excel_export,
)
from app.services.pdf_service import (
    generate_daily_executive_pdf,
    generate_monthly_kpi_pdf,
    generate_weekly_operations_pdf,
)
from app.services.powerpoint_service import (
    generate_executive_powerpoint,
)
from app.services.report_branding_service import (
    get_report_branding,
)
from app.services.live_kpi_service import (
    get_live_kpi_summary,
)
from app.services.weekly_kpi_service import (
    get_weekly_kpi_summary,
)
from app.services.monthly_kpi_service import (
    get_monthly_kpi_summary,
)
from app.services.report_history_service import (
    delete_report_history,
    get_recent_report_history,
    get_report_history_by_id,
    record_completed_report,
    record_failed_report,
    serialize_report_history,
)
from app.services.tenant_service import (
    resolve_authenticated_tenant,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/reports",
    tags=["Executive Reports"],
    dependencies=[
        Depends(get_current_user),
    ],
)


# ============================================================
# INTERNAL HELPERS
# ============================================================

def _prepare_buffer(
    buffer: BytesIO,
) -> int:
    """
    Reset a generated report buffer and calculate its byte size.

    Returns:
        File size in bytes.
    """

    if buffer is None:
        raise ValueError(
            "The report generator returned no file buffer."
        )

    if (
        not hasattr(buffer, "seek")
        or not hasattr(buffer, "tell")
    ):
        raise TypeError(
            "The report generator must return a "
            "seekable file-like buffer."
        )

    buffer.seek(
        0,
        2,
    )

    file_size_bytes = (
        buffer.tell()
    )

    buffer.seek(0)

    return file_size_bytes


def _get_generated_by(
    current_user: User,
) -> str:
    """
    Return a safe user label for report-history records.
    """

    full_name = str(
        current_user.full_name
        or ""
    ).strip()

    if full_name:
        return full_name

    email = str(
        current_user.email
        or ""
    ).strip()

    if email:
        return email

    return (
        f"User {current_user.id}"
    )


def _resolve_tenant(
    *,
    db: Session,
    current_user: User,
) -> dict:
    """
    Resolve the authenticated user's authoritative tenant.

    Security rule:
        Report endpoints never trust a frontend mine/company
        identifier for tenant selection.

        authenticated user
            -> tenant service
            -> company_id
            -> mine_id
            -> mine_name
            -> operation_profile
    """

    tenant = (
        resolve_authenticated_tenant(
            db=db,
            current_user=current_user,
        )
    )

    required_fields = (
        "company_id",
        "mine_id",
        "mine_name",
        "operation_profile",
    )

    missing_fields = [
        field
        for field
        in required_fields
        if tenant.get(field)
        is None
    ]

    if missing_fields:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Authenticated tenant configuration "
                "is incomplete."
            ),
        )

    return tenant


def _generate_report_response(
    *,
    db: Session,
    generator: Callable[
        [],
        BytesIO,
    ],
    report_key: str,
    report_name: str,
    report_format: str,
    filename: str,
    media_type: str,
    generated_by: str,
    company_id: int,
    mine_id: int,
) -> StreamingResponse:
    """
    Generate a report, persist tenant-aware report history,
    and return a download response.

    company_id + mine_id are authoritative tenant ownership
    fields for the history record.
    """

    branding = (
        get_report_branding(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
        )
    )

    try:
        report_buffer = (
            generator()
        )

        file_size_bytes = (
            _prepare_buffer(
                report_buffer
            )
        )

        record_completed_report(
            db=db,
            company_id=company_id,
            mine_id=mine_id,
            report_key=report_key,
            report_name=report_name,
            report_format=report_format,
            filename=filename,
            file_size_bytes=(
                file_size_bytes
            ),
            generated_by=generated_by,
            company_name=(
                branding.company_name
            ),
            mine_name=(
                branding.mine_name
            ),
        )

        return StreamingResponse(
            report_buffer,
            media_type=media_type,
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                ),
                "Content-Length": str(
                    file_size_bytes
                ),
            },
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Report generation failed: %s",
            report_name,
        )

        try:
            record_failed_report(
                db=db,
                company_id=company_id,
                mine_id=mine_id,
                report_key=report_key,
                report_name=report_name,
                report_format=report_format,
                filename=filename,
                generated_by=(
                    generated_by
                ),
                company_name=(
                    branding.company_name
                ),
                mine_name=(
                    branding.mine_name
                ),
                error_message=(
                    str(exc)
                ),
            )

        except Exception:
            # Preserve the original report-generation error.
            pass

        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                f"Failed to generate "
                f"{report_name}."
            ),
        ) from exc


# ============================================================
# DAILY EXECUTIVE PDF
# ============================================================

@router.get(
    "/daily/pdf",
    dependencies=[
        Depends(
            require_operational_editor
        ),
    ],
)
def download_daily_executive_pdf(
    mine_name: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=100,
        description=(
            "Deprecated compatibility parameter. "
            "The authenticated tenant determines "
            "the active mine."
        ),
    ),
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate and download the Daily Executive Report.

    The authenticated tenant determines company and mine.
    """

    del mine_name

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    live_kpis = (
        get_live_kpi_summary(
            db=db,
            company_id=tenant[
                "company_id"
            ],
            mine_id=tenant[
                "mine_id"
            ],
            mine_name=tenant[
                "mine_name"
            ],
            operation_profile=tenant[
                "operation_profile"
            ],
        )
    )

    if (
        live_kpis.get(
            "status"
        )
        != "Connected to PostgreSQL"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "No live operational data "
                "was found for the "
                "authenticated mine."
            ),
        )

    filename = (
        "Daily_Executive_Report_"
        f"{datetime.now().strftime('%Y-%m-%d')}"
        ".pdf"
    )

    return _generate_report_response(
        db=db,
        generator=lambda: (
            generate_daily_executive_pdf(
                live_kpis
            )
        ),
        report_key=(
            "daily_executive_report"
        ),
        report_name=(
            "Daily Executive Report"
        ),
        report_format="PDF",
        filename=filename,
        media_type="application/pdf",
        generated_by=(
            _get_generated_by(
                current_user
            )
        ),
        company_id=tenant[
            "company_id"
        ],
        mine_id=tenant[
            "mine_id"
        ],
    )


# ============================================================
# WEEKLY OPERATIONS PDF
# ============================================================

@router.get(
    "/weekly/pdf",
    dependencies=[
        Depends(
            require_operational_editor
        ),
    ],
)
def download_weekly_operations_pdf(
    mine_name: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=100,
        description=(
            "Deprecated compatibility parameter. "
            "The authenticated tenant determines "
            "the active mine."
        ),
    ),
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate and download the Weekly Operations Report.
    """

    del mine_name

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    weekly_kpis = (
        get_weekly_kpi_summary(
            db=db,
            company_id=tenant[
                "company_id"
            ],
            mine_id=tenant[
                "mine_id"
            ],
            mine_name=tenant[
                "mine_name"
            ],
            operation_profile=tenant[
                "operation_profile"
            ],
        )
    )

    if (
        weekly_kpis.get(
            "status"
        )
        != "Connected to PostgreSQL"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "No weekly operational data "
                "was found for the "
                "authenticated mine."
            ),
        )

    filename = (
        "Weekly_Operations_Report_"
        f"{datetime.now().strftime('%Y-%m-%d')}"
        ".pdf"
    )

    return _generate_report_response(
        db=db,
        generator=lambda: (
            generate_weekly_operations_pdf(
                weekly_kpis
            )
        ),
        report_key=(
            "weekly_operations_report"
        ),
        report_name=(
            "Weekly Operations Report"
        ),
        report_format="PDF",
        filename=filename,
        media_type="application/pdf",
        generated_by=(
            _get_generated_by(
                current_user
            )
        ),
        company_id=tenant[
            "company_id"
        ],
        mine_id=tenant[
            "mine_id"
        ],
    )


# ============================================================
# MONTHLY KPI PDF
# ============================================================

@router.get(
    "/monthly/pdf",
    dependencies=[
        Depends(
            require_operational_editor
        ),
    ],
)
def download_monthly_kpi_pdf(
    mine_name: Optional[str] = Query(
        default=None,
        min_length=1,
        max_length=100,
        description=(
            "Deprecated compatibility parameter. "
            "The authenticated tenant determines "
            "the active mine."
        ),
    ),
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate and download the Monthly KPI Pack.
    """

    del mine_name

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    monthly_kpis = (
        get_monthly_kpi_summary(
            db=db,
            company_id=tenant[
                "company_id"
            ],
            mine_id=tenant[
                "mine_id"
            ],
            mine_name=tenant[
                "mine_name"
            ],
            operation_profile=tenant[
                "operation_profile"
            ],
        )
    )

    if (
        monthly_kpis.get(
            "status"
        )
        != "Connected to PostgreSQL"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "No monthly operational data "
                "was found for the "
                "authenticated mine."
            ),
        )

    filename = (
        "Monthly_KPI_Pack_"
        f"{datetime.now().strftime('%Y-%m-%d')}"
        ".pdf"
    )

    return _generate_report_response(
        db=db,
        generator=lambda: (
            generate_monthly_kpi_pdf(
                monthly_kpis
            )
        ),
        report_key=(
            "monthly_kpi_pack"
        ),
        report_name=(
            "Monthly KPI Pack"
        ),
        report_format="PDF",
        filename=filename,
        media_type="application/pdf",
        generated_by=(
            _get_generated_by(
                current_user
            )
        ),
        company_id=tenant[
            "company_id"
        ],
        mine_id=tenant[
            "mine_id"
        ],
    )


# ============================================================
# EXECUTIVE EXCEL EXPORT
# ============================================================

@router.get(
    "/excel",
    dependencies=[
        Depends(
            require_operational_editor
        ),
    ],
)
def download_executive_excel_export(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate and download the tenant-isolated Executive
    Operations Excel workbook.

    Tenant context:
        company_id
        mine_id
        operation_profile

    The Excel service is responsible for operation-aware
    workbook structure.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    filename = (
        "Mine_Manager_AI_Executive_Export_"
        f"{datetime.now().strftime('%Y-%m-%d')}"
        ".xlsx"
    )

    return _generate_report_response(
        db=db,

        generator=lambda: (
            generate_executive_excel_export(
                db=db,
                company_id=tenant[
                    "company_id"
                ],
                mine_id=tenant[
                    "mine_id"
                ],
                operation_profile=tenant[
                    "operation_profile"
                ],
            )
        ),

        report_key=(
            "executive_excel_export"
        ),

        report_name=(
            "Executive Excel Export"
        ),

        report_format="XLSX",

        filename=filename,

        media_type=(
            "application/vnd."
            "openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),

        generated_by=(
            _get_generated_by(
                current_user
            )
        ),

        company_id=tenant[
            "company_id"
        ],

        mine_id=tenant[
            "mine_id"
        ],
    )


# ============================================================
# EXECUTIVE POWERPOINT EXPORT
# ============================================================

@router.get(
    "/powerpoint",
    dependencies=[
        Depends(
            require_operational_editor
        ),
    ],
)
def download_executive_powerpoint(
    db: Session = Depends(
        get_db
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Generate and download the tenant-isolated Executive
    Operations PowerPoint board pack.

    The authenticated tenant determines:
        - company_id
        - mine_id
        - operation_profile

    The PowerPoint service uses these values to isolate
    operational data and select the appropriate report layout.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    filename = (
        "Mine_Manager_AI_Executive_Board_Pack_"
        f"{datetime.now().strftime('%Y-%m-%d')}"
        ".pptx"
    )

    return _generate_report_response(
        db=db,

        generator=lambda: (
            generate_executive_powerpoint(
                db=db,
                company_id=tenant[
                    "company_id"
                ],
                mine_id=tenant[
                    "mine_id"
                ],
                operation_profile=tenant[
                    "operation_profile"
                ],
            )
        ),

        report_key=(
            "executive_board_pack"
        ),

        report_name=(
            "Executive Board Pack"
        ),

        report_format="PPTX",

        filename=filename,

        media_type=(
            "application/vnd."
            "openxmlformats-officedocument."
            "presentationml.presentation"
        ),

        generated_by=(
            _get_generated_by(
                current_user
            )
        ),

        company_id=tenant[
            "company_id"
        ],

        mine_id=tenant[
            "mine_id"
        ],
    )


# ============================================================
# REPORT HISTORY LIST
# ============================================================

@router.get(
    "/history"
)
def list_report_history(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description=(
            "Maximum number of history "
            "records to return."
        ),
    ),

    report_format: Optional[
        str
    ] = Query(
        default=None,
        description=(
            "Optional format filter: "
            "PDF, XLSX, or PPTX."
        ),
    ),

    report_status: Optional[
        str
    ] = Query(
        default=None,
        alias="status",
        description=(
            "Optional status filter: "
            "completed or failed."
        ),
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return recent generated-report history belonging only
    to the authenticated tenant.
    """

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    normalized_format = (
        report_format
        .strip()
        .upper()
        if report_format
        else None
    )

    normalized_status = (
        report_status
        .strip()
        .lower()
        if report_status
        else None
    )

    allowed_formats = {
        "PDF",
        "XLSX",
        "PPTX",
    }

    allowed_statuses = {
        "completed",
        "failed",
    }

    if (
        normalized_format
        and normalized_format
        not in allowed_formats
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid report format. "
                "Use PDF, XLSX, or PPTX."
            ),
        )

    if (
        normalized_status
        and normalized_status
        not in allowed_statuses
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid report status. "
                "Use completed or failed."
            ),
        )

    records = (
        get_recent_report_history(
            db=db,
            company_id=tenant[
                "company_id"
            ],
            mine_id=tenant[
                "mine_id"
            ],
            limit=limit,
            report_format=(
                normalized_format
            ),
            status=(
                normalized_status
            ),
        )
    )

    return {
        "success": True,
        "company_id": tenant[
            "company_id"
        ],
        "mine_id": tenant[
            "mine_id"
        ],
        "count": len(
            records
        ),
        "items": [
            serialize_report_history(
                record
            )
            for record
            in records
        ],
    }


# ============================================================
# REPORT HISTORY DETAIL
# ============================================================

@router.get(
    "/history/{report_history_id}",
)
def get_report_history_record(
    report_history_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return one report-history record belonging to the
    authenticated tenant.

    A record belonging to another tenant is intentionally
    returned as not found.
    """

    if report_history_id <= 0:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "report_history_id must "
                "be greater than zero."
            ),
        )

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    record = (
        get_report_history_by_id(
            db=db,
            report_history_id=(
                report_history_id
            ),
            company_id=tenant[
                "company_id"
            ],
            mine_id=tenant[
                "mine_id"
            ],
        )
    )

    if record is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Report history record "
                "not found."
            ),
        )

    return {
        "success": True,
        "item": (
            serialize_report_history(
                record
            )
        ),
    }


# ============================================================
# DELETE REPORT HISTORY
# ============================================================

@router.delete(
    "/history/{report_history_id}",
    dependencies=[
        Depends(
            require_mine_management
        ),
    ],
)
def remove_report_history_record(
    report_history_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Delete one report-history metadata record belonging to
    the authenticated tenant.

    Allowed roles:
        - Mine Manager
        - General Manager
        - Administrator
    """

    if report_history_id <= 0:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "report_history_id must "
                "be greater than zero."
            ),
        )

    tenant = _resolve_tenant(
        db=db,
        current_user=current_user,
    )

    deleted = (
        delete_report_history(
            db=db,
            report_history_id=(
                report_history_id
            ),
            company_id=tenant[
                "company_id"
            ],
            mine_id=tenant[
                "mine_id"
            ],
        )
    )

    if not deleted:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Report history record "
                "not found."
            ),
        )

    return {
        "success": True,
        "message": (
            "Report history record "
            "deleted successfully."
        ),
        "deleted_id":
            report_history_id,
    }