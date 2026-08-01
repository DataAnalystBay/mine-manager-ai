from typing import Any, Dict, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


DEFAULT_COMPANY_NAME = "Mine Manager AI"
DEFAULT_MINE_NAME = "Mine Operations"
DEFAULT_PRIMARY_COLOR = "#0F172A"
DEFAULT_SECONDARY_COLOR = "#334155"
DEFAULT_TIMEZONE = "UTC"
DEFAULT_LANGUAGE = "English"


def _clean_text(
    value: Any,
    fallback: str,
) -> str:
    """
    Return a clean string value or a safe fallback.
    """

    if value is None:
        return fallback

    cleaned_value = str(value).strip()

    return cleaned_value or fallback


def load_pdf_branding(
    db: Session,
    company_id: Optional[int] = None,
    mine_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Load company and mine branding for PDF reports.

    Selection logic:
        1. Use the requested company_id when supplied.
        2. Otherwise use the first company_settings record.
        3. Use the requested mine_id when supplied.
        4. Otherwise use the first mine linked to the selected company.
        5. Fall back safely when configuration records are missing.

    Returns:
        {
            "company_id": 1,
            "company_name": "Oyu Tolgoi LLC",
            "logo_url": "/static/logos/example.png",
            "primary_color": "#F97316",
            "secondary_color": "#1C1917",
            "timezone": "Asia/Ulaanbaatar",
            "language": "English",
            "mine_id": 1,
            "mine_name": "OT Surface Operations",
            "site_code": "DEMO-01",
            "location": "South Gobi, Mongolia",
            "mine_type": "Open Pit",
            "shift_pattern": "Day / Night Shift",
            "operating_hours": "24/7",
            "calendar_type": "Mining Calendar",
        }
    """

    # --------------------------------------------------
    # Company settings
    # --------------------------------------------------

    if company_id is not None:
        company_query = text(
            """
            SELECT
                id,
                company_name,
                logo_url,
                primary_color,
                secondary_color,
                timezone,
                language
            FROM company_settings
            WHERE id = :company_id
            LIMIT 1
            """
        )

        company_row = db.execute(
            company_query,
            {"company_id": company_id},
        ).mappings().first()

    else:
        company_query = text(
            """
            SELECT
                id,
                company_name,
                logo_url,
                primary_color,
                secondary_color,
                timezone,
                language
            FROM company_settings
            ORDER BY id
            LIMIT 1
            """
        )

        company_row = db.execute(
            company_query
        ).mappings().first()

    selected_company_id = (
        company_row.get("id")
        if company_row
        else None
    )

    # --------------------------------------------------
    # Mine settings
    # --------------------------------------------------

    mine_row = None

    if mine_id is not None:
        mine_query = text(
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
            FROM mine_settings
            WHERE id = :mine_id
            LIMIT 1
            """
        )

        mine_row = db.execute(
            mine_query,
            {"mine_id": mine_id},
        ).mappings().first()

    elif selected_company_id is not None:
        mine_query = text(
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
            FROM mine_settings
            WHERE company_id = :company_id
            ORDER BY id
            LIMIT 1
            """
        )

        mine_row = db.execute(
            mine_query,
            {"company_id": selected_company_id},
        ).mappings().first()

    else:
        mine_query = text(
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
            FROM mine_settings
            ORDER BY id
            LIMIT 1
            """
        )

        mine_row = db.execute(
            mine_query
        ).mappings().first()

    # --------------------------------------------------
    # Safe branding payload
    # --------------------------------------------------

    company_name = _clean_text(
        company_row.get("company_name") if company_row else None,
        DEFAULT_COMPANY_NAME,
    )

    mine_name = _clean_text(
        mine_row.get("mine_name") if mine_row else None,
        DEFAULT_MINE_NAME,
    )

    return {
        "company_id": selected_company_id,

        "company_name": company_name,

        "logo_url": (
            company_row.get("logo_url")
            if company_row
            else None
        ),

        "primary_color": _clean_text(
            company_row.get("primary_color")
            if company_row
            else None,
            DEFAULT_PRIMARY_COLOR,
        ),

        "secondary_color": _clean_text(
            company_row.get("secondary_color")
            if company_row
            else None,
            DEFAULT_SECONDARY_COLOR,
        ),

        "timezone": _clean_text(
            company_row.get("timezone")
            if company_row
            else None,
            DEFAULT_TIMEZONE,
        ),

        "language": _clean_text(
            company_row.get("language")
            if company_row
            else None,
            DEFAULT_LANGUAGE,
        ),

        "mine_id": (
            mine_row.get("id")
            if mine_row
            else None
        ),

        "mine_name": mine_name,

        "site_code": (
            mine_row.get("site_code")
            if mine_row
            else None
        ),

        "location": (
            mine_row.get("location")
            if mine_row
            else None
        ),

        "mine_type": (
            mine_row.get("mine_type")
            if mine_row
            else None
        ),

        "shift_pattern": (
            mine_row.get("shift_pattern")
            if mine_row
            else None
        ),

        "operating_hours": (
            mine_row.get("operating_hours")
            if mine_row
            else None
        ),

        "calendar_type": (
            mine_row.get("calendar_type")
            if mine_row
            else None
        ),
    }