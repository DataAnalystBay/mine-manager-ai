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

from app.database import get_db
from app.services.excel_service import generate_executive_excel_export
from app.services.pdf_service import (
    generate_daily_executive_pdf,
    generate_monthly_kpi_pdf,
    generate_weekly_operations_pdf,
)
from app.services.powerpoint_service import generate_executive_powerpoint
from app.services.report_branding_service import get_report_branding
from app.services.report_history_service import (
    delete_report_history,
    get_recent_report_history,
    get_report_history_by_id,
    record_completed_report,
    record_failed_report,
    serialize_report_history,
)


router = APIRouter(
    prefix="/reports",
    tags=["Executive Reports"],
)


# ---------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------


def _prepare_buffer(buffer: BytesIO) -> int:
    """
    Reset a generated report buffer and calculate its byte size.

    Returns:
        File size in bytes.
    """

    if buffer is None:
        raise ValueError("The report generator returned no file buffer.")

    if not hasattr(buffer, "seek") or not hasattr(buffer, "tell"):
        raise TypeError(
            "The report generator must return a seekable file-like buffer."
        )

    buffer.seek(0, 2)
    file_size_bytes = buffer.tell()
    buffer.seek(0)

    return file_size_bytes


def _generate_report_response(
    *,
    db: Session,
    generator: Callable[[], BytesIO],
    report_key: str,
    report_name: str,
    report_format: str,
    filename: str,
    media_type: str,
) -> StreamingResponse:
    """
    Generate a report, record its history, and return a download response.
    """

    branding = get_report_branding()

    try:
        report_buffer = generator()
        file_size_bytes = _prepare_buffer(report_buffer)

        record_completed_report(
            db=db,
            report_key=report_key,
            report_name=report_name,
            report_format=report_format,
            filename=filename,
            file_size_bytes=file_size_bytes,
            generated_by="Current User",
            company_name=branding.company_name,
            mine_name=branding.mine_name,
        )

        return StreamingResponse(
            report_buffer,
            media_type=media_type,
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                ),
                "Content-Length": str(file_size_bytes),
            },
        )

    except Exception as exc:
        try:
            record_failed_report(
                db=db,
                report_key=report_key,
                report_name=report_name,
                report_format=report_format,
                filename=filename,
                generated_by="Current User",
                company_name=branding.company_name,
                mine_name=branding.mine_name,
                error_message=str(exc),
            )
        except Exception:
            # Preserve the original generation error if history recording fails.
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate {report_name}.",
        ) from exc


# ---------------------------------------------------------------------
# Report downloads
# ---------------------------------------------------------------------


@router.get("/daily/pdf")
def download_daily_executive_pdf(
    db: Session = Depends(get_db),
):
    """
    Generate and download the Daily Executive Report PDF.
    """

    filename = (
        f"Daily_Executive_Report_"
        f"{datetime.now().strftime('%Y-%m-%d')}.pdf"
    )

    return _generate_report_response(
        db=db,
        generator=generate_daily_executive_pdf,
        report_key="daily_executive_report",
        report_name="Daily Executive Report",
        report_format="PDF",
        filename=filename,
        media_type="application/pdf",
    )


@router.get("/weekly/pdf")
def download_weekly_operations_pdf(
    db: Session = Depends(get_db),
):
    """
    Generate and download the Weekly Operations Report PDF.
    """

    filename = (
        f"Weekly_Operations_Report_"
        f"{datetime.now().strftime('%Y-%m-%d')}.pdf"
    )

    return _generate_report_response(
        db=db,
        generator=generate_weekly_operations_pdf,
        report_key="weekly_operations_report",
        report_name="Weekly Operations Report",
        report_format="PDF",
        filename=filename,
        media_type="application/pdf",
    )


@router.get("/monthly/pdf")
def download_monthly_kpi_pdf(
    db: Session = Depends(get_db),
):
    """
    Generate and download the Monthly KPI Pack PDF.
    """

    filename = (
        f"Monthly_KPI_Pack_"
        f"{datetime.now().strftime('%Y-%m-%d')}.pdf"
    )

    return _generate_report_response(
        db=db,
        generator=generate_monthly_kpi_pdf,
        report_key="monthly_kpi_pack",
        report_name="Monthly KPI Pack",
        report_format="PDF",
        filename=filename,
        media_type="application/pdf",
    )


@router.get("/excel")
def download_executive_excel_export(
    db: Session = Depends(get_db),
):
    """
    Generate and download the Executive Operations Excel workbook.
    """

    filename = (
        f"Mine_Manager_AI_Executive_Export_"
        f"{datetime.now().strftime('%Y-%m-%d')}.xlsx"
    )

    return _generate_report_response(
        db=db,
        generator=generate_executive_excel_export,
        report_key="executive_excel_export",
        report_name="Executive Excel Export",
        report_format="XLSX",
        filename=filename,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
    )


@router.get("/powerpoint")
def download_executive_powerpoint(
    db: Session = Depends(get_db),
):
    """
    Generate and download the Executive Operations PowerPoint board pack.
    """

    filename = (
        f"Mine_Manager_AI_Executive_Board_Pack_"
        f"{datetime.now().strftime('%Y-%m-%d')}.pptx"
    )

    return _generate_report_response(
        db=db,
        generator=generate_executive_powerpoint,
        report_key="executive_board_pack",
        report_name="Executive Board Pack",
        report_format="PPTX",
        filename=filename,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "presentationml.presentation"
        ),
    )


# ---------------------------------------------------------------------
# Report history
# ---------------------------------------------------------------------


@router.get("/history")
def list_report_history(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of history records to return.",
    ),
    report_format: Optional[str] = Query(
        default=None,
        description="Optional format filter: PDF, XLSX, or PPTX.",
    ),
    report_status: Optional[str] = Query(
        default=None,
        alias="status",
        description="Optional status filter: completed or failed.",
    ),
    db: Session = Depends(get_db),
):
    """
    Return recent generated-report history.
    """

    records = get_recent_report_history(
        db=db,
        limit=limit,
        report_format=report_format,
        status=report_status,
    )

    return {
        "success": True,
        "count": len(records),
        "items": [
            serialize_report_history(record)
            for record in records
        ],
    }


@router.get("/history/{report_history_id}")
def get_report_history_record(
    report_history_id: int,
    db: Session = Depends(get_db),
):
    """
    Return one report-history record by ID.
    """

    record = get_report_history_by_id(
        db=db,
        report_history_id=report_history_id,
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report history record not found.",
        )

    return {
        "success": True,
        "item": serialize_report_history(record),
    }


@router.delete("/history/{report_history_id}")
def remove_report_history_record(
    report_history_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete one report-history metadata record.
    """

    deleted = delete_report_history(
        db=db,
        report_history_id=report_history_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report history record not found.",
        )

    return {
        "success": True,
        "message": "Report history record deleted successfully.",
        "deleted_id": report_history_id,
    }
