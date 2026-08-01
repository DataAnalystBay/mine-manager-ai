from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import sessionmaker

from app.database import engine
from app.models.company import CompanySettings
from app.models.mine import MineSettings


# -------------------------------------------------------------------
# Default branding
# -------------------------------------------------------------------

DEFAULT_COMPANY_NAME = "Mine Manager AI"
DEFAULT_MINE_NAME = "Demo Mine"

DEFAULT_PRIMARY_COLOR = "#16A34A"
DEFAULT_SECONDARY_COLOR = "#1E293B"

DEFAULT_TIMEZONE = "Asia/Ulaanbaatar"
DEFAULT_LANGUAGE = "English"


# -------------------------------------------------------------------
# Branding data object
# -------------------------------------------------------------------

@dataclass
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
        Return the primary color without '#', suitable for openpyxl.
        """

        return self.primary_color.replace("#", "").upper()

    @property
    def secondary_color_excel(self) -> str:
        """
        Return the secondary color without '#', suitable for openpyxl.
        """

        return self.secondary_color.replace("#", "").upper()


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
    Normalize a hex color into the format #RRGGBB.

    Valid examples:
        #16A34A
        16A34A
        #abc
        abc
    """

    if not value:
        return default.upper()

    cleaned_value = str(value).strip().replace("#", "")

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
    Convert a configured static logo URL into a local filesystem path.

    Example:
        /static/logos/company-logo.png

    becomes:
        backend/app/static/logos/company-logo.png
    """

    if not logo_url:
        return None

    cleaned_logo_url = str(logo_url).strip()

    if not cleaned_logo_url:
        return None

    backend_root = Path(__file__).resolve().parents[2]

    if cleaned_logo_url.startswith("/static/"):
        relative_path = cleaned_logo_url.lstrip("/")
        candidate_path = backend_root / "app" / relative_path
    elif cleaned_logo_url.startswith("static/"):
        candidate_path = backend_root / "app" / cleaned_logo_url
    else:
        candidate_path = Path(cleaned_logo_url)

        if not candidate_path.is_absolute():
            candidate_path = backend_root / cleaned_logo_url

    candidate_path = candidate_path.resolve()

    if not candidate_path.exists():
        return None

    if not candidate_path.is_file():
        return None

    return str(candidate_path)


# -------------------------------------------------------------------
# Public service
# -------------------------------------------------------------------

def get_report_branding() -> ReportBranding:
    """
    Load the active company and mine configuration from PostgreSQL.

    Safe defaults are returned when:
        - company settings do not exist
        - mine settings do not exist
        - optional branding values are empty
        - the configured logo file cannot be found
    """

    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    database_session = SessionLocal()

    try:
        company = (
            database_session.query(CompanySettings)
            .order_by(CompanySettings.id.asc())
            .first()
        )

        mine = (
            database_session.query(MineSettings)
            .order_by(MineSettings.id.asc())
            .first()
        )

        company_name = _normalize_text(
            getattr(company, "company_name", None),
            DEFAULT_COMPANY_NAME,
        )

        mine_name = _normalize_text(
            getattr(mine, "mine_name", None),
            DEFAULT_MINE_NAME,
        )

        logo_url = getattr(company, "logo_url", None)

        primary_color = _normalize_hex_color(
            getattr(company, "primary_color", None),
            DEFAULT_PRIMARY_COLOR,
        )

        secondary_color = _normalize_hex_color(
            getattr(company, "secondary_color", None),
            DEFAULT_SECONDARY_COLOR,
        )

        timezone = _normalize_text(
            getattr(company, "timezone", None),
            DEFAULT_TIMEZONE,
        )

        language = _normalize_text(
            getattr(company, "language", None),
            DEFAULT_LANGUAGE,
        )

        logo_path = _resolve_logo_path(logo_url)

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

    finally:
        database_session.close()
