from datetime import time
import os
from pathlib import Path
from typing import Optional
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
    require_general_manager_or_administrator,
)
from app.database import get_db
from app.models.alert_threshold import AlertThreshold
from app.models.company import CompanySettings
from app.models.kpi_target import KpiTarget
from app.models.mine import MineSettings
from app.models.shift_pattern import ShiftPattern


router = APIRouter(
    prefix="/api/config",
    tags=["Configuration"],
    dependencies=[
        Depends(get_current_user),
    ],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class CompanyUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None


class MineUpdateRequest(BaseModel):
    mine_name: Optional[str] = None
    site_code: Optional[str] = None
    location: Optional[str] = None
    mine_type: Optional[str] = None
    shift_pattern: Optional[str] = None
    operating_hours: Optional[str] = None
    calendar_type: Optional[str] = None


class ShiftUpdateRequest(BaseModel):
    shift_name: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    shift_type: Optional[str] = None
    is_active: Optional[bool] = None


class KpiTargetUpdateRequest(BaseModel):
    kpi_name: Optional[str] = None
    kpi_category: Optional[str] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    direction: Optional[str] = None


class AlertThresholdUpdateRequest(BaseModel):
    alert_name: Optional[str] = None
    kpi_name: Optional[str] = None
    warning_value: Optional[float] = None
    critical_value: Optional[float] = None
    unit: Optional[str] = None
    alert_level: Optional[str] = None


# ============================================================
# COMPANY SETTINGS
# ============================================================

@router.get("/company")
def get_company_settings(
    db: Session = Depends(get_db),
):
    """
    Return company configuration.

    All authenticated roles may view configuration.
    """

    company = (
        db.query(CompanySettings)
        .order_by(CompanySettings.id.asc())
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company settings not found",
        )

    return company


@router.put(
    "/company",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def update_company_settings(
    request: CompanyUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update company configuration.

    General Manager or Administrator access is required.
    """

    company = (
        db.query(CompanySettings)
        .order_by(CompanySettings.id.asc())
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company settings not found",
        )

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            company,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(company)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to update company settings."
            ),
        ) from exc

    return company


# ============================================================
# COMPANY LOGO
# ============================================================

@router.post(
    "/logo",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def upload_company_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a company logo.

    General Manager or Administrator access is required.
    """

    allowed_content_types = {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    }

    allowed_extensions = {
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
    }

    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only PNG, JPG, JPEG, and WEBP "
                "logo files are allowed."
            ),
        )

    original_filename = Path(
        file.filename or ""
    ).name

    file_extension = Path(
        original_filename
    ).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The uploaded logo has an unsupported "
                "file extension."
            ),
        )

    upload_directory = Path(
        "app/static/logos"
    )

    upload_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    safe_filename = (
        f"{uuid.uuid4().hex}{file_extension}"
    )

    file_path = (
        upload_directory / safe_filename
    )

    try:
        with file_path.open("wb") as buffer:
            while True:
                chunk = file.file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                buffer.write(chunk)

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to save the company logo.",
        ) from exc

    logo_url = (
        f"/static/logos/{safe_filename}"
    )

    company = (
        db.query(CompanySettings)
        .order_by(CompanySettings.id.asc())
        .first()
    )

    if not company:
        try:
            os.remove(file_path)
        except OSError:
            pass

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company settings not found",
        )

    company.logo_url = logo_url

    try:
        db.commit()
        db.refresh(company)

    except Exception as exc:
        db.rollback()

        try:
            os.remove(file_path)
        except OSError:
            pass

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to update the company logo."
            ),
        ) from exc

    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url,
        "company": company,
    }


# ============================================================
# MINE SETTINGS
# ============================================================

@router.get("/mine")
def get_mine_settings(
    db: Session = Depends(get_db),
):
    """
    Return mine configuration.

    All authenticated roles may view configuration.
    """

    mine = (
        db.query(MineSettings)
        .order_by(MineSettings.id.asc())
        .first()
    )

    if not mine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mine settings not found",
        )

    return mine


@router.put(
    "/mine",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def update_mine_settings(
    request: MineUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update mine configuration.

    General Manager or Administrator access is required.
    """

    mine = (
        db.query(MineSettings)
        .order_by(MineSettings.id.asc())
        .first()
    )

    if not mine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mine settings not found",
        )

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            mine,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(mine)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to update mine settings.",
        ) from exc

    return mine


# ============================================================
# KPI TARGETS
# ============================================================

@router.get("/kpi-targets")
def get_kpi_targets(
    db: Session = Depends(get_db),
):
    """
    Return configured KPI targets.
    """

    return (
        db.query(KpiTarget)
        .order_by(KpiTarget.id.asc())
        .all()
    )


@router.put(
    "/kpi-targets/{kpi_id}",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def update_kpi_target(
    kpi_id: int,
    request: KpiTargetUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update a KPI target.

    General Manager or Administrator access is required.
    """

    kpi = (
        db.query(KpiTarget)
        .filter(KpiTarget.id == kpi_id)
        .first()
    )

    if not kpi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="KPI target not found",
        )

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            kpi,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(kpi)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="Unable to update the KPI target.",
        ) from exc

    return kpi


# ============================================================
# ALERT THRESHOLDS
# ============================================================

@router.get("/alert-thresholds")
def get_alert_thresholds(
    db: Session = Depends(get_db),
):
    """
    Return configured alert thresholds.
    """

    return (
        db.query(AlertThreshold)
        .order_by(AlertThreshold.id.asc())
        .all()
    )


@router.put(
    "/alert-thresholds/{alert_id}",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def update_alert_threshold(
    alert_id: int,
    request: AlertThresholdUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update an alert threshold.

    General Manager or Administrator access is required.
    """

    alert = (
        db.query(AlertThreshold)
        .filter(
            AlertThreshold.id == alert_id
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert threshold not found",
        )

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            alert,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(alert)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to update the alert threshold."
            ),
        ) from exc

    return alert


# ============================================================
# SHIFT PATTERNS
# ============================================================

@router.get("/shift-patterns")
def get_shift_patterns(
    db: Session = Depends(get_db),
):
    """
    Return configured shift patterns.
    """

    return (
        db.query(ShiftPattern)
        .order_by(ShiftPattern.id.asc())
        .all()
    )


@router.put(
    "/shift-patterns/{shift_id}",
    dependencies=[
        Depends(
            require_general_manager_or_administrator
        ),
    ],
)
def update_shift_pattern(
    shift_id: int,
    request: ShiftUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update a shift pattern.

    General Manager or Administrator access is required.
    """

    shift = (
        db.query(ShiftPattern)
        .filter(
            ShiftPattern.id == shift_id
        )
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift pattern not found",
        )

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            shift,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(shift)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to update the shift pattern."
            ),
        ) from exc

    return shift


# ============================================================
# FULL CONFIGURATION
# ============================================================

@router.get("/full")
def get_full_configuration(
    db: Session = Depends(get_db),
):
    """
    Return the complete configuration package.

    All authenticated roles may view configuration.
    """

    company = (
        db.query(CompanySettings)
        .order_by(CompanySettings.id.asc())
        .first()
    )

    mine = (
        db.query(MineSettings)
        .order_by(MineSettings.id.asc())
        .first()
    )

    kpi_targets = (
        db.query(KpiTarget)
        .order_by(KpiTarget.id.asc())
        .all()
    )

    alert_thresholds = (
        db.query(AlertThreshold)
        .order_by(AlertThreshold.id.asc())
        .all()
    )

    shift_patterns = (
        db.query(ShiftPattern)
        .order_by(ShiftPattern.id.asc())
        .all()
    )

    return {
        "company": company,
        "mine": mine,
        "kpi_targets": kpi_targets,
        "alert_thresholds": alert_thresholds,
        "shift_patterns": shift_patterns,
    }