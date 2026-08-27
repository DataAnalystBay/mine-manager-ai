from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from app.database import engine


# ============================================================
# SAFE DEFAULTS
# ============================================================

DEFAULT_COMPANY_NAME = "Mine Manager AI"
DEFAULT_MINE_NAME = "Mining Operation"

DEFAULT_PRIMARY_COLOR = "#0F172A"
DEFAULT_SECONDARY_COLOR = "#020617"

DEFAULT_TIMEZONE = "Asia/Ulaanbaatar"
DEFAULT_LANGUAGE = "English"


# ============================================================
# REPORT BRANDING MODEL
# ============================================================

@dataclass(frozen=True)
class ReportBranding:
    company_name: str
    mine_name: str

    logo_url: Optional[str]
    logo_path: Optional[str]

    primary_color: str
    secondary_color: str

    timezone: str
    language: str

    company_id: Optional[int] = None
    mine_id: Optional[int] = None

    @property
    def primary_color_excel(self) -> str:
        """
        Return the primary color without '#',
        suitable for openpyxl.
        """

        return (
            self.primary_color
            .replace("#", "")
            .upper()
        )

    @property
    def secondary_color_excel(self) -> str:
        """
        Return the secondary color without '#',
        suitable for openpyxl.
        """

        return (
            self.secondary_color
            .replace("#", "")
            .upper()
        )


# ============================================================
# INTERNAL HELPERS
# ============================================================

def _normalize_text(
    value: Optional[str],
    default: str,
) -> str:
    """
    Return a cleaned text value or the provided default.
    """

    if value is None:
        return default

    cleaned_value = str(
        value
    ).strip()

    if not cleaned_value:
        return default

    return cleaned_value


def _normalize_hex_color(
    value: Optional[str],
    default: str,
) -> str:
    """
    Normalize a hex color into #RRGGBB format.
    """

    if not value:
        return default.upper()

    cleaned_value = (
        str(value)
        .strip()
        .replace("#", "")
    )

    if len(cleaned_value) == 3:
        cleaned_value = "".join(
            character * 2
            for character in cleaned_value
        )

    if len(cleaned_value) != 6:
        return default.upper()

    try:
        int(
            cleaned_value,
            16,
        )

    except ValueError:
        return default.upper()

    return (
        f"#{cleaned_value.upper()}"
    )


def _resolve_logo_path(
    logo_url: Optional[str],
) -> Optional[str]:
    """
    Convert a configured static logo URL into a local
    filesystem path.

    Example:

        /static/logos/company-logo.png

    becomes:

        backend/app/static/logos/company-logo.png
    """

    if not logo_url:
        return None

    cleaned_logo_url = str(
        logo_url
    ).strip()

    if not cleaned_logo_url:
        return None

    backend_root = (
        Path(__file__)
        .resolve()
        .parents[2]
    )

    if cleaned_logo_url.startswith(
        "/static/"
    ):
        relative_path = (
            cleaned_logo_url
            .lstrip("/")
        )

        candidate_path = (
            backend_root
            / "app"
            / relative_path
        )

    elif cleaned_logo_url.startswith(
        "static/"
    ):
        candidate_path = (
            backend_root
            / "app"
            / cleaned_logo_url
        )

    else:
        candidate_path = Path(
            cleaned_logo_url
        )

        if not candidate_path.is_absolute():
            candidate_path = (
                backend_root
                / cleaned_logo_url
            )

    try:
        candidate_path = (
            candidate_path.resolve()
        )

    except OSError:
        return None

    if not candidate_path.exists():
        return None

    if not candidate_path.is_file():
        return None

    return str(
        candidate_path
    )


# ============================================================
# DATABASE HELPERS
# ============================================================

def _load_company(
    db: Session,
    company_id: int,
):
    """
    Load exactly one operational company configuration.
    """

    query = text(
        """
        SELECT
            id,
            company_name,
            logo_url,
            primary_color,
            secondary_color,
            timezone,
            language
        FROM public.company_settings
        WHERE id = :company_id
        LIMIT 1
        """
    )

    return (
        db.execute(
            query,
            {
                "company_id":
                    int(company_id),
            },
        )
        .mappings()
        .first()
    )


def _load_mine(
    db: Session,
    company_id: int,
    mine_id: int,
):
    """
    Load exactly one mine belonging to the supplied
    operational company.

    Both IDs are checked so a mine cannot be paired with
    another customer's configuration.
    """

    query = text(
        """
        SELECT
            id,
            company_id,
            mine_name,
            site_code,
            location,
            mine_type,
            shift_pattern,
            operating_hours,
            calendar_type
        FROM public.mine_settings
        WHERE id = :mine_id
          AND company_id = :company_id
        LIMIT 1
        """
    )

    return (
        db.execute(
            query,
            {
                "company_id":
                    int(company_id),

                "mine_id":
                    int(mine_id),
            },
        )
        .mappings()
        .first()
    )


def _load_latest_company(
    db: Session,
):
    """
    Temporary V1 fallback.

    Return the most recently created operational company
    configuration when no explicit tenant context is supplied.

    This preserves older report callers during migration.

    Future:
        All commercial report calls should provide authenticated
        company_id + mine_id explicitly.
    """

    query = text(
        """
        SELECT
            id,
            company_name,
            logo_url,
            primary_color,
            secondary_color,
            timezone,
            language
        FROM public.company_settings
        ORDER BY id DESC
        LIMIT 1
        """
    )

    return (
        db.execute(query)
        .mappings()
        .first()
    )


def _load_latest_company_mine(
    db: Session,
    company_id: int,
):
    """
    Temporary V1 fallback.

    Return the latest configured mine belonging to the supplied
    operational company.
    """

    query = text(
        """
        SELECT
            id,
            company_id,
            mine_name,
            site_code,
            location,
            mine_type,
            shift_pattern,
            operating_hours,
            calendar_type
        FROM public.mine_settings
        WHERE company_id = :company_id
        ORDER BY id DESC
        LIMIT 1
        """
    )

    return (
        db.execute(
            query,
            {
                "company_id":
                    int(company_id),
            },
        )
        .mappings()
        .first()
    )


def _build_branding(
    *,
    company,
    mine,
) -> ReportBranding:
    """
    Convert company + mine database rows into ReportBranding.
    """

    if company is None:
        raise ValueError(
            "Company configuration was not found."
        )

    if mine is None:
        raise ValueError(
            "Mine configuration was not found."
        )

    company_id = int(
        company.get("id")
    )

    mine_id = int(
        mine.get("id")
    )

    company_name = _normalize_text(
        company.get(
            "company_name"
        ),
        DEFAULT_COMPANY_NAME,
    )

    mine_name = _normalize_text(
        mine.get(
            "mine_name"
        ),
        DEFAULT_MINE_NAME,
    )

    logo_url = company.get(
        "logo_url"
    )

    logo_path = _resolve_logo_path(
        logo_url
    )

    primary_color = _normalize_hex_color(
        company.get(
            "primary_color"
        ),
        DEFAULT_PRIMARY_COLOR,
    )

    secondary_color = _normalize_hex_color(
        company.get(
            "secondary_color"
        ),
        DEFAULT_SECONDARY_COLOR,
    )

    timezone = _normalize_text(
        company.get(
            "timezone"
        ),
        DEFAULT_TIMEZONE,
    )

    language = _normalize_text(
        company.get(
            "language"
        ),
        DEFAULT_LANGUAGE,
    )

    return ReportBranding(
        company_id=company_id,
        mine_id=mine_id,

        company_name=company_name,
        mine_name=mine_name,

        logo_url=logo_url,
        logo_path=logo_path,

        primary_color=primary_color,
        secondary_color=secondary_color,

        timezone=timezone,
        language=language,
    )


# ============================================================
# PUBLIC SERVICE
# ============================================================

def get_report_branding(
    db: Optional[Session] = None,
    company_id: Optional[int] = None,
    mine_id: Optional[int] = None,
) -> ReportBranding:
    """
    Return branding for report generation.

    Preferred commercial / tenant-safe usage:

        get_report_branding(
            db=db,
            company_id=company.id,
            mine_id=mine.id,
        )

    Compatibility usage during V1 migration:

        get_report_branding()

    Tenant-safe behavior:
        - company_id and mine_id must both be provided together.
        - mine_id must belong to company_id.
        - invalid tenant combinations fail instead of silently
          selecting another customer's configuration.

    Compatibility behavior:
        - when neither ID is supplied, the latest configured
          company and its latest mine are used.
        - this fallback exists only so older PDF/history callers
          continue working during tenant-context migration.

    Database session behavior:
        - an existing SQLAlchemy Session may be supplied.
        - otherwise this service creates and closes its own
          temporary Session.
    """

    # --------------------------------------------------------
    # Validate tenant arguments
    # --------------------------------------------------------

    if (
        company_id is None
        and mine_id is not None
    ):
        raise ValueError(
            "company_id is required when mine_id is supplied."
        )

    if (
        company_id is not None
        and mine_id is None
    ):
        raise ValueError(
            "mine_id is required when company_id is supplied."
        )

    # --------------------------------------------------------
    # Session ownership
    # --------------------------------------------------------

    owns_session = False
    database_session = db

    if database_session is None:
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
        )

        database_session = SessionLocal()
        owns_session = True

    try:
        # ====================================================
        # TENANT-AWARE MODE
        # ====================================================

        if (
            company_id is not None
            and mine_id is not None
        ):
            company = _load_company(
                db=database_session,
                company_id=int(
                    company_id
                ),
            )

            if company is None:
                raise ValueError(
                    "Company configuration "
                    f"{company_id} was not found."
                )

            mine = _load_mine(
                db=database_session,
                company_id=int(
                    company_id
                ),
                mine_id=int(
                    mine_id
                ),
            )

            if mine is None:
                raise ValueError(
                    "Mine configuration "
                    f"{mine_id} was not found "
                    f"for company {company_id}."
                )

            return _build_branding(
                company=company,
                mine=mine,
            )

        # ====================================================
        # V1 COMPATIBILITY FALLBACK
        # ====================================================

        company = _load_latest_company(
            db=database_session,
        )

        if company is None:
            raise ValueError(
                "No company configuration "
                "is available for report generation."
            )

        fallback_company_id = int(
            company.get("id")
        )

        mine = _load_latest_company_mine(
            db=database_session,
            company_id=fallback_company_id,
        )

        if mine is None:
            raise ValueError(
                "No mine configuration is available "
                f"for company {fallback_company_id}."
            )

        return _build_branding(
            company=company,
            mine=mine,
        )

    finally:
        if (
            owns_session
            and database_session is not None
        ):
            database_session.close()