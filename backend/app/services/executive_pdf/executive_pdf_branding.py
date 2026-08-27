from typing import Any, Dict

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

    cleaned_value = str(
        value
    ).strip()

    return (
        cleaned_value
        or fallback
    )


def load_pdf_branding(
    db: Session,
    company_id: int,
    mine_id: int,
) -> Dict[str, Any]:
    """
    Load company and mine branding for one authenticated
    Mine Manager AI tenant.

    Security boundary:
        company_id + mine_id

    Both identifiers are mandatory.

    The mine is returned only when:
        mine_settings.id == mine_id
        AND
        mine_settings.company_id == company_id

    This function intentionally does not fall back to the
    first configured company or mine. Tenant ownership must
    already have been established by authentication.
    """

    if company_id is None:
        raise ValueError(
            "company_id is required "
            "for PDF branding."
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required "
            "for PDF branding."
        )

    try:
        normalized_company_id = int(
            company_id
        )

        normalized_mine_id = int(
            mine_id
        )

    except (
        TypeError,
        ValueError,
    ) as exc:
        raise ValueError(
            "company_id and mine_id must "
            "be valid integers."
        ) from exc

    if normalized_company_id < 1:
        raise ValueError(
            "company_id must be greater "
            "than or equal to 1."
        )

    if normalized_mine_id < 1:
        raise ValueError(
            "mine_id must be greater "
            "than or equal to 1."
        )

    # ==================================================
    # COMPANY SETTINGS
    # ==================================================

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
        FROM public.company_settings
        WHERE id = :company_id
        LIMIT 1
        """
    )

    company_row = db.execute(
        company_query,
        {
            "company_id":
                normalized_company_id,
        },
    ).mappings().first()

    if company_row is None:
        raise ValueError(
            (
                "Company configuration was not "
                "found for company_id="
                f"{normalized_company_id}."
            )
        )

    # ==================================================
    # MINE SETTINGS
    # ==================================================
    #
    # Critical tenant-isolation rule:
    #
    #     mine_id
    #         +
    #     company_id
    #
    # A mine ID belonging to another company must never
    # be returned.
    # ==================================================

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
        FROM public.mine_settings
        WHERE id = :mine_id
          AND company_id = :company_id
        LIMIT 1
        """
    )

    mine_row = db.execute(
        mine_query,
        {
            "mine_id":
                normalized_mine_id,

            "company_id":
                normalized_company_id,
        },
    ).mappings().first()

    if mine_row is None:
        raise ValueError(
            (
                "Mine configuration was not found "
                "for company_id="
                f"{normalized_company_id} "
                "and mine_id="
                f"{normalized_mine_id}."
            )
        )

    # ==================================================
    # TENANT-SAFE BRANDING PAYLOAD
    # ==================================================

    company_name = _clean_text(
        company_row.get(
            "company_name"
        ),
        DEFAULT_COMPANY_NAME,
    )

    mine_name = _clean_text(
        mine_row.get(
            "mine_name"
        ),
        DEFAULT_MINE_NAME,
    )

    return {
        "company_id": (
            normalized_company_id
        ),

        "company_name": (
            company_name
        ),

        "logo_url": (
            company_row.get(
                "logo_url"
            )
        ),

        "primary_color": _clean_text(
            company_row.get(
                "primary_color"
            ),
            DEFAULT_PRIMARY_COLOR,
        ),

        "secondary_color": _clean_text(
            company_row.get(
                "secondary_color"
            ),
            DEFAULT_SECONDARY_COLOR,
        ),

        "timezone": _clean_text(
            company_row.get(
                "timezone"
            ),
            DEFAULT_TIMEZONE,
        ),

        "language": _clean_text(
            company_row.get(
                "language"
            ),
            DEFAULT_LANGUAGE,
        ),

        "mine_id": (
            normalized_mine_id
        ),

        "mine_name": (
            mine_name
        ),

        "site_code": (
            mine_row.get(
                "site_code"
            )
        ),

        "location": (
            mine_row.get(
                "location"
            )
        ),

        "mine_type": (
            mine_row.get(
                "mine_type"
            )
        ),

        "shift_pattern": (
            mine_row.get(
                "shift_pattern"
            )
        ),

        "operating_hours": (
            mine_row.get(
                "operating_hours"
            )
        ),

        "calendar_type": (
            mine_row.get(
                "calendar_type"
            )
        ),
    }