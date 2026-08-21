from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import time
import os
import uuid

from app.database import get_db
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.models.kpi_target import KpiTarget
from app.models.alert_threshold import AlertThreshold
from app.models.shift_pattern import ShiftPattern


router = APIRouter(
    prefix="/api/config",
    tags=["Configuration"],
)


# ============================================================
# ACTIVE CUSTOMER / MINE CONFIGURATION
# ============================================================

ACTIVE_COMPANY_ID = int(os.getenv("ACTIVE_COMPANY_ID", "1"))
ACTIVE_MINE_ID = int(os.getenv("ACTIVE_MINE_ID", "1"))


def get_active_company(db: Session) -> CompanySettings:
    """
    Return the company configured as active in backend/.env.

    Example:
        ACTIVE_COMPANY_ID=2
    """

    company = (
        db.query(CompanySettings)
        .filter(CompanySettings.id == ACTIVE_COMPANY_ID)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"Active company {ACTIVE_COMPANY_ID} not found",
        )

    return company


def get_active_mine(db: Session) -> MineSettings:
    """
    Return the mine / operation configured as active.

    The mine must also belong to the active company.
    """

    mine = (
        db.query(MineSettings)
        .filter(
            MineSettings.id == ACTIVE_MINE_ID,
            MineSettings.company_id == ACTIVE_COMPANY_ID,
        )
        .first()
    )

    if not mine:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Active mine {ACTIVE_MINE_ID} not found "
                f"for company {ACTIVE_COMPANY_ID}"
            ),
        )

    return mine


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
# COMPANY
# ============================================================

@router.get("/company")
def get_company_settings(
    db: Session = Depends(get_db),
):
    return get_active_company(db)


@router.put("/company")
def update_company_settings(
    request: CompanyUpdateRequest,
    db: Session = Depends(get_db),
):
    company = get_active_company(db)

    update_data = request.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(company, key, value)

    db.commit()
    db.refresh(company)

    return company


# ============================================================
# COMPANY LOGO
# ============================================================

@router.post("/logo")
def upload_company_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    allowed_types = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG, JPEG, and WEBP logo files are allowed",
        )

    upload_dir = "app/static/logos"
    os.makedirs(upload_dir, exist_ok=True)

    filename = file.filename or "logo.png"

    if "." not in filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded logo must include a valid file extension",
        )

    original_extension = filename.rsplit(".", 1)[-1].lower()

    allowed_extensions = {
        "png",
        "jpg",
        "jpeg",
        "webp",
    }

    if original_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported logo file extension",
        )

    safe_filename = f"{uuid.uuid4()}.{original_extension}"
    file_path = os.path.join(
        upload_dir,
        safe_filename,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    logo_url = f"/static/logos/{safe_filename}"

    company = get_active_company(db)

    company.logo_url = logo_url

    db.commit()
    db.refresh(company)

    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url,
        "company": company,
    }


# ============================================================
# MINE / OPERATION
# ============================================================

@router.get("/mine")
def get_mine_settings(
    db: Session = Depends(get_db),
):
    return get_active_mine(db)


@router.put("/mine")
def update_mine_settings(
    request: MineUpdateRequest,
    db: Session = Depends(get_db),
):
    mine = get_active_mine(db)

    update_data = request.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(mine, key, value)

    db.commit()
    db.refresh(mine)

    return mine


# ============================================================
# KPI TARGETS
# ============================================================

@router.get("/kpi-targets")
def get_kpi_targets(
    db: Session = Depends(get_db),
):
    mine = get_active_mine(db)

    return (
        db.query(KpiTarget)
        .filter(KpiTarget.mine_id == mine.id)
        .order_by(KpiTarget.id.asc())
        .all()
    )


@router.put("/kpi-targets/{kpi_id}")
def update_kpi_target(
    kpi_id: int,
    request: KpiTargetUpdateRequest,
    db: Session = Depends(get_db),
):
    mine = get_active_mine(db)

    kpi = (
        db.query(KpiTarget)
        .filter(
            KpiTarget.id == kpi_id,
            KpiTarget.mine_id == mine.id,
        )
        .first()
    )

    if not kpi:
        raise HTTPException(
            status_code=404,
            detail="KPI target not found",
        )

    update_data = request.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(kpi, key, value)

    db.commit()
    db.refresh(kpi)

    return kpi


# ============================================================
# ALERT THRESHOLDS
# ============================================================

@router.get("/alert-thresholds")
def get_alert_thresholds(
    db: Session = Depends(get_db),
):
    mine = get_active_mine(db)

    return (
        db.query(AlertThreshold)
        .filter(AlertThreshold.mine_id == mine.id)
        .order_by(AlertThreshold.id.asc())
        .all()
    )


@router.put("/alert-thresholds/{alert_id}")
def update_alert_threshold(
    alert_id: int,
    request: AlertThresholdUpdateRequest,
    db: Session = Depends(get_db),
):
    mine = get_active_mine(db)

    alert = (
        db.query(AlertThreshold)
        .filter(
            AlertThreshold.id == alert_id,
            AlertThreshold.mine_id == mine.id,
        )
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert threshold not found",
        )

    update_data = request.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(alert, key, value)

    db.commit()
    db.refresh(alert)

    return alert


# ============================================================
# SHIFT PATTERNS
# ============================================================

@router.get("/shift-patterns")
def get_shift_patterns(
    db: Session = Depends(get_db),
):
    return (
        db.query(ShiftPattern)
        .order_by(ShiftPattern.id.asc())
        .all()
    )


@router.put("/shift-patterns/{shift_id}")
def update_shift_pattern(
    shift_id: int,
    request: ShiftUpdateRequest,
    db: Session = Depends(get_db),
):
    shift = (
        db.query(ShiftPattern)
        .filter(ShiftPattern.id == shift_id)
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Shift pattern not found",
        )

    update_data = request.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(shift, key, value)

    db.commit()
    db.refresh(shift)

    return shift


# ============================================================
# FULL CONFIGURATION
# ============================================================

@router.get("/full")
def get_full_configuration(
    db: Session = Depends(get_db),
):
    company = get_active_company(db)
    mine = get_active_mine(db)

    kpi_targets = (
        db.query(KpiTarget)
        .filter(KpiTarget.mine_id == mine.id)
        .order_by(KpiTarget.id.asc())
        .all()
    )

    alert_thresholds = (
        db.query(AlertThreshold)
        .filter(AlertThreshold.mine_id == mine.id)
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