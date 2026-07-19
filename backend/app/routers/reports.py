from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.pdf_service import (
    generate_daily_executive_pdf,
    generate_weekly_operations_pdf,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/daily/pdf")
def download_daily_report():
    pdf_buffer = generate_daily_executive_pdf()

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                'attachment; filename="daily_executive_report.pdf"'
            )
        },
    )


@router.get("/weekly/pdf")
def download_weekly_report():
    pdf_buffer = generate_weekly_operations_pdf()

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                'attachment; filename="weekly_operations_report.pdf"'
            )
        },
    )