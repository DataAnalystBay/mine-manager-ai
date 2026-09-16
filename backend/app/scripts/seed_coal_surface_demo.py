"""Idempotently create the V1.0 coal demo tenant configuration."""
import os

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models.auth_company import Company
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.models.kpi_target import KpiTarget
from app.models.alert_threshold import AlertThreshold
from app.models.user import User
from app.operation_profiles.coal_surface_profile import COAL_SURFACE_PROFILE

COMPANY_EN = "Coal Mining Demo"
COMPANY_MN = "Нүүрсний уурхайн демо"
MINE_EN = "Coal Surface Operations"
MINE_MN = "Нүүрсний ил уурхайн үйл ажиллагаа"
DEFAULT_ADMIN_DISPLAY_NAME = "Coal Demo Administrator"


def provision_administrator(db, auth_company, email, password, display_name=None):
    normalized_email = str(email or "").strip().lower()
    normalized_name = str(display_name or "").strip()

    if "@" not in normalized_email:
        raise ValueError("COAL_ADMIN_EMAIL must be a valid email address.")
    if not 8 <= len(password or "") <= 128:
        raise ValueError("COAL_ADMIN_PASSWORD must contain 8 to 128 characters.")

    user = db.query(User).filter(User.email == normalized_email).first()
    if user:
        if user.company_id != auth_company.id:
            raise RuntimeError(
                "COAL_ADMIN_EMAIL already belongs to another tenant."
            )
        user.role = "Administrator"
        user.is_active = True
        if normalized_name:
            user.full_name = normalized_name
        return user

    user = User(
        company_id=auth_company.id,
        full_name=normalized_name or DEFAULT_ADMIN_DISPLAY_NAME,
        email=normalized_email,
        hashed_password=hash_password(password),
        role="Administrator",
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def seed(db, admin_email=None, admin_password=None, admin_display_name=None):
    company = db.query(CompanySettings).filter_by(company_name=COMPANY_EN).first()
    if not company:
        company = CompanySettings(company_name=COMPANY_EN, company_name_en=COMPANY_EN,
                                  company_name_mn=COMPANY_MN, timezone="Asia/Ulaanbaatar",
                                  language="English")
        db.add(company); db.flush()
    mine = db.query(MineSettings).filter_by(company_id=company.id, mine_name=MINE_EN).first()
    if not mine:
        mine = MineSettings(company_id=company.id, mine_name=MINE_EN, mine_name_en=MINE_EN,
                            mine_name_mn=MINE_MN, site_code="COAL-DEMO",
                            mine_type="Coal Surface Mining", shift_pattern="2 x 12-hour shifts",
                            operating_hours="24/7 continuous", calendar_type="continuous")
        db.add(mine); db.flush()
    auth = db.query(Company).filter_by(company_name=COMPANY_EN, mine_name=MINE_EN).first()
    if not auth:
        auth = Company(company_name=COMPANY_EN, mine_name=MINE_EN, is_active=True)
        db.add(auth)
        db.flush()
    else:
        auth.is_active = True
    if bool(admin_email) != bool(admin_password):
        raise ValueError(
            "COAL_ADMIN_EMAIL and COAL_ADMIN_PASSWORD must be supplied together."
        )
    if admin_email:
        provision_administrator(
            db,
            auth,
            admin_email,
            admin_password,
            admin_display_name,
        )
    for code, label, category, target, unit, direction, executive in COAL_SURFACE_PROFILE["kpis"]:
        row = db.query(KpiTarget).filter_by(mine_id=mine.id, kpi_code=code).first()
        values = {"kpi_name": label, "kpi_code": code, "kpi_category": category,
                  "target_value": target, "unit": unit, "direction": direction,
                  "is_executive": executive, "is_active": True}
        if row:
            for key, value in values.items(): setattr(row, key, value)
        else:
            db.add(KpiTarget(mine_id=mine.id, **values))
    for code, values in COAL_SURFACE_PROFILE["thresholds"].items():
        row = db.query(AlertThreshold).filter_by(mine_id=mine.id, kpi_name=code).first()
        payload = {"alert_name": f"{code}_status", "warning_value": values["warning"],
                   "critical_value": values["critical"]}
        if row:
            for key, value in payload.items(): setattr(row, key, value)
        else:
            db.add(AlertThreshold(mine_id=mine.id, kpi_name=code, **payload))
    db.commit()
    return company.id, mine.id

if __name__ == "__main__":
    session = SessionLocal()
    try:
        print(
            seed(
                session,
                admin_email=os.getenv("COAL_ADMIN_EMAIL"),
                admin_password=os.getenv("COAL_ADMIN_PASSWORD"),
                admin_display_name=os.getenv("COAL_ADMIN_DISPLAY_NAME"),
            )
        )
    finally:
        session.close()
