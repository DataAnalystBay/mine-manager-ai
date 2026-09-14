import argparse
import getpass
import os

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models.auth_company import Company
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.models.user import User
from app.scripts.seed_achit_ikht_demo import (
    COMPANY_NAME as ACHIT_COMPANY_NAME,
    MINE_NAME as ACHIT_MINE_NAME,
    get_or_create_company as get_or_create_achit_company,
    get_or_create_mine as get_or_create_achit_mine,
    seed_alerts as seed_achit_alerts,
    seed_kpis as seed_achit_kpis,
)


OYU_COMPANY_NAME = "Oyu Tolgoi LLC"
OYU_MINE_NAME = "Oyu Tolgoi Surface"
LEGACY_OYU_COMPANY_NAME = "Oyu Tolgoi"
LEGACY_OYU_MINE_NAME = "Open Pit"


def _recover_oyu_auth_company(db: Session) -> Company:
    canonical = (
        db.query(Company)
        .filter(
            Company.company_name == OYU_COMPANY_NAME,
            Company.mine_name == OYU_MINE_NAME,
        )
        .first()
    )
    legacy = (
        db.query(Company)
        .filter(
            Company.company_name == LEGACY_OYU_COMPANY_NAME,
            Company.mine_name == LEGACY_OYU_MINE_NAME,
        )
        .first()
    )

    if canonical and legacy and canonical.id != legacy.id:
        raise RuntimeError(
            "Both canonical and temporary Oyu authentication companies exist."
        )
    if canonical:
        return canonical
    if not legacy:
        raise RuntimeError(
            "Expected temporary Oyu authentication company was not found."
        )

    legacy.company_name = OYU_COMPANY_NAME
    legacy.mine_name = OYU_MINE_NAME
    return legacy


def _get_or_create_oyu_configuration(
    db: Session,
) -> tuple[CompanySettings, MineSettings]:
    company = (
        db.query(CompanySettings)
        .filter(CompanySettings.company_name == OYU_COMPANY_NAME)
        .first()
    )
    if not company:
        company = CompanySettings(
            company_name=OYU_COMPANY_NAME,
            company_name_en=OYU_COMPANY_NAME,
        )
        db.add(company)
        db.flush()

    mine = (
        db.query(MineSettings)
        .filter(
            MineSettings.company_id == company.id,
            MineSettings.mine_name == OYU_MINE_NAME,
        )
        .first()
    )
    if not mine:
        mine = MineSettings(
            company_id=company.id,
            mine_name=OYU_MINE_NAME,
            mine_name_en=OYU_MINE_NAME,
        )
        db.add(mine)
        db.flush()

    return company, mine


def _get_or_create_achit_auth_company(db: Session) -> Company:
    company = (
        db.query(Company)
        .filter(
            Company.company_name == ACHIT_COMPANY_NAME,
            Company.mine_name == ACHIT_MINE_NAME,
        )
        .first()
    )
    if company:
        company.is_active = True
        return company

    company = Company(
        company_name=ACHIT_COMPANY_NAME,
        mine_name=ACHIT_MINE_NAME,
        is_active=True,
    )
    db.add(company)
    db.flush()
    return company


def recover_customer_configurations(db: Session) -> dict:
    oyu_auth = _recover_oyu_auth_company(db)
    oyu_company, oyu_mine = _get_or_create_oyu_configuration(db)

    achit_auth = _get_or_create_achit_auth_company(db)
    achit_company = get_or_create_achit_company(db)
    achit_mine = get_or_create_achit_mine(db, achit_company)
    seed_achit_kpis(db, achit_mine)
    seed_achit_alerts(db, achit_mine)

    db.commit()
    return {
        "oyu_auth_company_id": oyu_auth.id,
        "oyu_company_id": oyu_company.id,
        "oyu_mine_id": oyu_mine.id,
        "achit_auth_company_id": achit_auth.id,
        "achit_company_id": achit_company.id,
        "achit_mine_id": achit_mine.id,
    }


def provision_achit_administrator(
    db: Session,
    company_id: int,
    email: str,
    full_name: str,
) -> User:
    normalized_email = email.lower().strip()
    normalized_name = full_name.strip()
    if "@" not in normalized_email or len(normalized_name) < 2:
        raise RuntimeError("A valid email and full name are required.")

    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        if existing.company_id != company_id:
            raise RuntimeError("That email belongs to another tenant.")
        if existing.role != "Administrator" or not existing.is_active:
            raise RuntimeError(
                "That Achit user is not an active Administrator."
            )
        return existing

    password = getpass.getpass("Achit Administrator password: ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        raise RuntimeError("Passwords do not match.")
    if len(password) < 10 or len(password) > 128:
        raise RuntimeError("Password must contain 10 to 128 characters.")

    user = User(
        company_id=company_id,
        full_name=normalized_name,
        email=normalized_email,
        hashed_password=hash_password(password),
        role="Administrator",
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Recover the supported V1.0 customer configurations."
    )
    parser.add_argument("--confirm-database-name", required=True)
    parser.add_argument("--achit-admin-email")
    parser.add_argument("--achit-admin-name")
    args = parser.parse_args()

    if bool(args.achit_admin_email) != bool(args.achit_admin_name):
        raise SystemExit(
            "Provide both --achit-admin-email and --achit-admin-name."
        )

    configured_name = os.getenv("DB_NAME")
    if args.confirm_database_name != configured_name:
        raise SystemExit(
            "Refusing recovery: confirmation does not match DB_NAME."
        )

    db = SessionLocal()
    try:
        database_name = db.execute(text("SELECT current_database()"))
        database_name = database_name.scalar_one()
        if database_name != configured_name:
            raise RuntimeError(
                "Connected database does not match configured DB_NAME."
            )

        result = recover_customer_configurations(db)
        if args.achit_admin_email:
            user = provision_achit_administrator(
                db=db,
                company_id=result["achit_auth_company_id"],
                email=args.achit_admin_email,
                full_name=args.achit_admin_name,
            )
            result["achit_administrator_id"] = user.id
        print("Customer configuration recovery complete.")
        for key, value in result.items():
            print(f"{key}: {value}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
