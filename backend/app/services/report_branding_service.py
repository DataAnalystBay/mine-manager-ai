from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from sqlalchemy import text

from app.database import engine


# -------------------------------------------------------------------
# Safe defaults
# -------------------------------------------------------------------

# These are intentionally customer-neutral.
# Real customer values should come from PostgreSQL configuration.

DEFAULT_COMPANY_NAME = "Mine Manager AI"
DEFAULT_MINE_NAME = "Mining Operation"

DEFAULT_PRIMARY_COLOR = "#0F172A"
DEFAULT_SECONDARY_COLOR = "#020617"

DEFAULT_TIMEZONE = "Asia/Ulaanbaatar"
DEFAULT_LANGUAGE = "English"


# -------------------------------------------------------------------
# Report branding model
# -------------------------------------------------------------------

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


# -------------------------------------------------------------------
# Internal helpers
# -------------------------------------------------------------------

def _normalize_text(
    value: Optional[str],
    default: str,
) -> str:
    """
    Return a cleaned text value or the provided default.
    """

    if value is None:
        return default

    cleaned_value = str(value).strip()

    if not cleaned_value:
        return default

    return cleaned_value


def _normalize_hex_color(
    value: Optional[str],
    default: str,
) -> str:
    """
    Normalize a hex color into #RRGGBB format.

    Examples:
        #16A34A
        16A34A
        #abc
        abc
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
        int(cleaned_value, 16)
    except ValueError:
        return default.upper()

    return f"#{cleaned_value.upper()}"


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

    candidate_path = (
        candidate_path.resolve()
    )

    if not candidate_path.exists():
        return None

    if not candidate_path.is_file():
        return None

    return str(candidate_path)


# -------------------------------------------------------------------
# Database helpers
# -------------------------------------------------------------------

def _load_latest_company():
    """
    Return the latest configured company.

    V1.0 behavior:
        The newest company configuration is treated as the
        currently active customer.

    Future multi-tenant behavior:
        Replace this with authenticated-user / tenant resolution.
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

    with engine.connect() as connection:
        row = (
            connection
            .execute(query)
            .mappings()
            .first()
        )

    return row


def _load_company_mine(
    company_id: int,
):
    """
    Return the latest mine belonging to the selected company.

    The company_id filter prevents a company from being paired
    with another customer's mine configuration.
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

    with engine.connect() as connection:
        row = (
            connection
            .execute(
                query,
                {
                    "company_id":
                        company_id,
                },
            )
            .mappings()
            .first()
        )

    return row


# -------------------------------------------------------------------
# Public service
# -------------------------------------------------------------------

def get_report_branding() -> ReportBranding:
    """
    Load the active company and mine configuration from PostgreSQL.

    Current V1.0 selection strategy:
        1. Select the latest configured company.
        2. Select the latest mine belonging to that company.
        3. Use customer branding values from company_settings.

    Safe defaults are returned when:
        - company settings do not exist
        - mine settings do not exist
        - optional branding values are empty
        - the configured logo file cannot be found

    Important:
        This service deliberately does not hard-code Achit-Ikht
        or Oyu Tolgoi. The customer comes from PostgreSQL.
    """

    company = _load_latest_company()

    mine = None

    if company is not None:
        company_id = company.get(
            "id"
        )

        if company_id is not None:
            mine = _load_company_mine(
                int(company_id)
            )

    # ---------------------------------------------------------------
    # Company
    # ---------------------------------------------------------------

    company_name = _normalize_text(
        (
            company.get(
                "company_name"
            )
            if company
            else None
        ),
        DEFAULT_COMPANY_NAME,
    )

    # ---------------------------------------------------------------
    # Mine / Operation
    # ---------------------------------------------------------------

    mine_name = _normalize_text(
        (
            mine.get(
                "mine_name"
            )
            if mine
            else None
        ),
        DEFAULT_MINE_NAME,
    )

    # ---------------------------------------------------------------
    # Logo
    # ---------------------------------------------------------------

    logo_url = (
        company.get(
            "logo_url"
        )
        if company
        else None
    )

    logo_path = _resolve_logo_path(
        logo_url
    )

    # ---------------------------------------------------------------
    # Colors
    # ---------------------------------------------------------------

    primary_color = _normalize_hex_color(
        (
            company.get(
                "primary_color"
            )
            if company
            else None
        ),
        DEFAULT_PRIMARY_COLOR,
    )

    secondary_color = _normalize_hex_color(
        (
            company.get(
                "secondary_color"
            )
            if company
            else None
        ),
        DEFAULT_SECONDARY_COLOR,
    )

    # ---------------------------------------------------------------
    # Timezone
    # ---------------------------------------------------------------

    timezone = _normalize_text(
        (
            company.get(
                "timezone"
            )
            if company
            else None
        ),
        DEFAULT_TIMEZONE,
    )

    # ---------------------------------------------------------------
    # Language
    # ---------------------------------------------------------------

    language = _normalize_text(
        (
            company.get(
                "language"
            )
            if company
            else None
        ),
        DEFAULT_LANGUAGE,
    )

    # ---------------------------------------------------------------
    # Result
    # ---------------------------------------------------------------

    return ReportBranding(
        company_name=company_name,
        mine_name=mine_name,
        logo_url=logo_url,
        logo_path=logo_path,
        primary_color=primary_color,
        secondary_color=secondary_color,
        timezone=timezone,
        language=language,
    )