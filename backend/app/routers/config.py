from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import time
import os
import uuid

from app.database import get_db
from app.auth.dependencies import get_current_user

from app.models.user import User
from app.models.auth_company import Company
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
# TENANT / CUSTOMER CONFIGURATION
# ============================================================

def get_auth_company(
    db: Session,
    current_user: User,
) -> Company:
    """
    Return the authenticated tenant from public.companies.

    User.company_id references public.companies.id.
    """

    if current_user.company_id is None:
        raise HTTPException(
            status_code=403,
            detail="User is not assigned to a company",
        )

    auth_company = (
        db.query(Company)
        .filter(Company.id == current_user.company_id)
        .first()
    )

    if not auth_company:
        raise HTTPException(
            status_code=404,
            detail=f"Auth company {current_user.company_id} not found",
        )

    if auth_company.is_active is False:
        raise HTTPException(
            status_code=403,
            detail="Company account is inactive",
        )

    return auth_company


def get_user_company(
    db: Session,
    current_user: User,
) -> CompanySettings:
    """
    Resolve operational company configuration using the
    authenticated tenant's company name.

    Authentication:
        users.company_id
            -> public.companies.id

    Configuration:
        public.companies.company_name
            -> company_settings.company_name
    """

    auth_company = get_auth_company(
        db=db,
        current_user=current_user,
    )

    company = (
        db.query(CompanySettings)
        .filter(
            CompanySettings.company_name == auth_company.company_name
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Configuration not found for company "
                f"'{auth_company.company_name}'"
            ),
        )

    return company


def get_user_mine(
    db: Session,
    current_user: User,
) -> MineSettings:
    """
    Resolve operational mine configuration using the
    authenticated tenant's company and mine names.
    """

    auth_company = get_auth_company(
        db=db,
        current_user=current_user,
    )

    company = get_user_company(
        db=db,
        current_user=current_user,
    )

    mine = (
        db.query(MineSettings)
        .filter(
            MineSettings.company_id == company.id,
            MineSettings.mine_name == auth_company.mine_name,
        )
        .first()
    )

    if not mine:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Mine configuration "
                f"'{auth_company.mine_name}' "
                f"not found for company "
                f"'{auth_company.company_name}'"
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
    current_user: User = Depends(get_current_user),
):
    return get_user_company(
        db=db,
        current_user=current_user,
    )


@router.put("/company")
def update_company_settings(
    request: CompanyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = get_user_company(
        db=db,
        current_user=current_user,
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
    current_user: User = Depends(get_current_user),
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
            detail=(
                "Only PNG, JPG, JPEG, and WEBP "
                "logo files are allowed"
            ),
        )

    filename = file.filename or "logo.png"

    if "." not in filename:
        raise HTTPException(
            status_code=400,
            detail=(
                "Uploaded logo must include "
                "a valid file extension"
            ),
        )

    original_extension = (
        filename
        .rsplit(".", 1)[-1]
        .lower()
    )

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

    upload_dir = "app/static/logos"

    os.makedirs(
        upload_dir,
        exist_ok=True,
    )

    safe_filename = (
        f"{uuid.uuid4()}."
        f"{original_extension}"
    )

    file_path = os.path.join(
        upload_dir,
        safe_filename,
    )

    with open(
        file_path,
        "wb",
    ) as buffer:
        buffer.write(
            file.file.read()
        )

    logo_url = (
        f"/static/logos/"
        f"{safe_filename}"
    )

    company = get_user_company(
        db=db,
        current_user=current_user,
    )

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
    current_user: User = Depends(get_current_user),
):
    return get_user_mine(
        db=db,
        current_user=current_user,
    )


@router.put("/mine")
def update_mine_settings(
    request: MineUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
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

    db.commit()
    db.refresh(mine)

    return mine


# ============================================================
# KPI TARGETS
# ============================================================

@router.get("/kpi-targets")
def get_kpi_targets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

    return (
        db.query(KpiTarget)
        .filter(
            KpiTarget.mine_id == mine.id
        )
        .order_by(
            KpiTarget.id.asc()
        )
        .all()
    )


@router.put("/kpi-targets/{kpi_id}")
def update_kpi_target(
    kpi_id: int,
    request: KpiTargetUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

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

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            kpi,
            key,
            value,
        )

    db.commit()
    db.refresh(kpi)

    return kpi


# ============================================================
# ALERT THRESHOLDS
# ============================================================

@router.get("/alert-thresholds")
def get_alert_thresholds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

    return (
        db.query(AlertThreshold)
        .filter(
            AlertThreshold.mine_id == mine.id
        )
        .order_by(
            AlertThreshold.id.asc()
        )
        .all()
    )


@router.put("/alert-thresholds/{alert_id}")
def update_alert_threshold(
    alert_id: int,
    request: AlertThresholdUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

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

    update_data = request.dict(
        exclude_unset=True,
    )

    for key, value in update_data.items():
        setattr(
            alert,
            key,
            value,
        )

    db.commit()
    db.refresh(alert)

    return alert


# ============================================================
# SHIFT PATTERNS
# ============================================================

@router.get("/shift-patterns")
def get_shift_patterns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

    return (
        db.query(ShiftPattern)
        .filter(
            ShiftPattern.mine_id == mine.id
        )
        .order_by(
            ShiftPattern.id.asc()
        )
        .all()
    )


@router.put("/shift-patterns/{shift_id}")
def update_shift_pattern(
    shift_id: int,
    request: ShiftUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

    shift = (
        db.query(ShiftPattern)
        .filter(
            ShiftPattern.id == shift_id,
            ShiftPattern.mine_id == mine.id,
        )
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=404,
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

    db.commit()
    db.refresh(shift)

    return shift


# ============================================================
# FULL CONFIGURATION
# ============================================================

@router.get("/full")
def get_full_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = get_user_company(
        db=db,
        current_user=current_user,
    )

    mine = get_user_mine(
        db=db,
        current_user=current_user,
    )

    kpi_targets = (
        db.query(KpiTarget)
        .filter(
            KpiTarget.mine_id == mine.id
        )
        .order_by(
            KpiTarget.id.asc()
        )
        .all()
    )

    alert_thresholds = (
        db.query(AlertThreshold)
        .filter(
            AlertThreshold.mine_id == mine.id
        )
        .order_by(
            AlertThreshold.id.asc()
        )
        .all()
    )

    shift_patterns = (
        db.query(ShiftPattern)
        .filter(
            ShiftPattern.mine_id == mine.id
        )
        .order_by(
            ShiftPattern.id.asc()
        )
        .all()
    )

    return {
        "company": company,
        "mine": mine,
        "kpi_targets": kpi_targets,
        "alert_thresholds": alert_thresholds,
        "shift_patterns": shift_patterns,
    }