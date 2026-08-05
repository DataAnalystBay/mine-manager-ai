from __future__ import annotations

import json
from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.auth.dependencies import require_administrator
from app.services.support_diagnostics_service import (
    get_support_diagnostics,
    get_support_diagnostics_summary,
)


router = APIRouter(
    prefix="/api/support-diagnostics",
    tags=["Support Diagnostics"],
)


@router.get("")
def read_support_diagnostics(
    _current_user=Depends(require_administrator),
):
    return get_support_diagnostics()


@router.get("/summary")
def read_support_diagnostics_summary(
    _current_user=Depends(require_administrator),
):
    return get_support_diagnostics_summary()


@router.get("/download")
def download_support_diagnostics(
    _current_user=Depends(require_administrator),
):
    diagnostics = get_support_diagnostics()

    generated_at = datetime.now(
        timezone.utc
    ).strftime("%Y%m%d_%H%M%S")

    filename = (
        f"mine_manager_ai_support_diagnostics_"
        f"{generated_at}.json"
    )

    payload = json.dumps(
        diagnostics,
        indent=2,
        ensure_ascii=False,
        default=str,
    ).encode("utf-8")

    stream = BytesIO(payload)

    return StreamingResponse(
        stream,
        media_type="application/json",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )