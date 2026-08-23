from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.auth_company import Company
from app.models.company import CompanySettings
from app.models.mine import MineSettings


def resolve_authenticated_tenant(
    db: Session,
    current_user: User,
) -> dict:
    """
    Resolve the operational tenant for the authenticated user.

    Authentication:
        users.company_id
            -> public.companies.id

    Operational configuration:
        public.companies.company_name
            -> company_settings.company_name

        public.companies.mine_name
            -> mine_settings.mine_name

    IDs in public.companies and company_settings are intentionally
    not assumed to match.
    """

    if current_user.company_id is None:
        raise HTTPException(
            status_code=403,
            detail="User is not assigned to a company",
        )

    auth_company = (
        db.query(Company)
        .filter(
            Company.id == current_user.company_id
        )
        .first()
    )

    if not auth_company:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Auth company "
                f"{current_user.company_id} not found"
            ),
        )

    if auth_company.is_active is False:
        raise HTTPException(
            status_code=403,
            detail="Company account is inactive",
        )

    company = (
        db.query(CompanySettings)
        .filter(
            CompanySettings.company_name
            == auth_company.company_name
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail=(
                "Operational company configuration "
                f"not found for "
                f"'{auth_company.company_name}'"
            ),
        )

    mine = (
        db.query(MineSettings)
        .filter(
            MineSettings.company_id == company.id,
            MineSettings.mine_name
            == auth_company.mine_name,
        )
        .first()
    )

    if not mine:
        raise HTTPException(
            status_code=404,
            detail=(
                "Operational mine configuration "
                f"'{auth_company.mine_name}' "
                f"not found for "
                f"'{auth_company.company_name}'"
            ),
        )

    mine_type = str(
        mine.mine_type or ""
    ).strip().lower()

    is_sxew_operation = (
        mine_type
        in {
            "processing plant / sx-ew",
            "sx-ew",
            "hydrometallurgical copper processing",
        }
        or mine.mine_name
        == "Achit-Ikht Copper Cathode Operation"
    )

    return {
        "auth_company_id": int(auth_company.id),
        "company_id": int(company.id),
        "mine_id": int(mine.id),
        "company_name": company.company_name,
        "mine_name": mine.mine_name,
        "mine_type": mine.mine_type,
        "operation_profile": (
            "sxew_copper"
            if is_sxew_operation
            else "standard_mine"
        ),
        "waste_applicable": (
            not is_sxew_operation
        ),
        "fleet_applicable": (
            not is_sxew_operation
        ),
    }


def get_current_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    FastAPI dependency returning the operational tenant
    belonging to the authenticated user.
    """

    return resolve_authenticated_tenant(
        db=db,
        current_user=current_user,
    )