from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


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
            for character
            in cleaned_value
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
    Load exactly one company configuration by operational
    tenant company_id.

    The caller must obtain company_id from the authenticated
    tenant resolver.
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
                    company_id,
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
    Load exactly one mine belonging to the supplied company.

    Both company_id and mine_id are required so a mine can
    never be paired with another customer's company.
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
                    company_id,

                "mine_id":
                    mine_id,
            },
        )
        .mappings()
        .first()
    )


# ============================================================
# PUBLIC SERVICE
# ============================================================

def get_report_branding(
    db: Session,
    company_id: int,
    mine_id: int,
) -> ReportBranding:
    """
    Return report branding for the authenticated operational
    tenant.

    Security boundary:

        authenticated user
            -> tenant resolver
            -> company_id + mine_id
            -> company_settings + mine_settings
            -> report branding

    company_id and mine_id must come from trusted tenant
    context rather than frontend-controlled query parameters.

    Safe defaults are used only for optional branding values.

    Missing tenant company/mine configuration raises an error
    rather than silently selecting another customer.
    """

    if company_id is None:
        raise ValueError(
            "company_id is required "
            "for report branding"
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required "
            "for report branding"
        )

    company = _load_company(
        db=db,
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
        db=db,
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

    # --------------------------------------------------------
    # COMPANY
    # --------------------------------------------------------

    company_name = _normalize_text(
        company.get(
            "company_name"
        ),
        DEFAULT_COMPANY_NAME,
    )

    # --------------------------------------------------------
    # MINE
    # --------------------------------------------------------

    mine_name = _normalize_text(
        mine.get(
            "mine_name"
        ),
        DEFAULT_MINE_NAME,
    )

    # --------------------------------------------------------
    # LOGO
    # --------------------------------------------------------

    logo_url = company.get(
        "logo_url"
    )

    logo_path = _resolve_logo_path(
        logo_url
    )

    # --------------------------------------------------------
    # COLORS
    # --------------------------------------------------------

    primary_color = (
        _normalize_hex_color(
            company.get(
                "primary_color"
            ),
            DEFAULT_PRIMARY_COLOR,
        )
    )

    secondary_color = (
        _normalize_hex_color(
            company.get(
                "secondary_color"
            ),
            DEFAULT_SECONDARY_COLOR,
        )
    )

    # --------------------------------------------------------
    # TIMEZONE
    # --------------------------------------------------------

    timezone = _normalize_text(
        company.get(
            "timezone"
        ),
        DEFAULT_TIMEZONE,
    )

    # --------------------------------------------------------
    # LANGUAGE
    # --------------------------------------------------------

    language = _normalize_text(
        company.get(
            "language"
        ),
        DEFAULT_LANGUAGE,
    )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return ReportBranding(
        company_id=int(
            company_id
        ),

        mine_id=int(
            mine_id
        ),

        company_name=company_name,
        mine_name=mine_name,

        logo_url=logo_url,
        logo_path=logo_path,

        primary_color=primary_color,
        secondary_color=secondary_color,

        timezone=timezone,
        language=language,
    )