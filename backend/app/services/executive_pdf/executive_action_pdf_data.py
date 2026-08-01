from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.services.executive_action_service import (
    list_actions,
)


PRIORITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
}


def _normalize_kpi_key(kpi_key: str) -> str:
    """
    Normalize a KPI key to the format used by the Executive Actions API.
    """

    if not isinstance(kpi_key, str):
        raise TypeError("kpi_key must be a string.")

    normalized = (
        kpi_key.strip()
        .lower()
        .replace(" ", "_")
    )

    if not normalized:
        raise ValueError("kpi_key cannot be empty.")

    return normalized


def _display_text(
    value: Any,
    fallback: str = "Not specified",
) -> str:
    """
    Convert nullable database values into safe PDF display text.
    """

    if value is None:
        return fallback

    text = str(value).strip()

    return text if text else fallback


def _format_enum_value(
    value: Any,
    fallback: str,
) -> str:
    """
    Convert values such as 'in_progress' into 'In Progress'.
    """

    text = _display_text(
        value,
        fallback,
    )

    return text.replace("_", " ").title()


def _priority_sort_key(action: Any):
    """
    Sort actions by business priority first, then newest record.
    """

    priority = (
        str(getattr(action, "priority", "medium"))
        .strip()
        .lower()
    )

    priority_rank = PRIORITY_ORDER.get(
        priority,
        99,
    )

    created_at = getattr(
        action,
        "created_at",
        None,
    )

    action_id = getattr(
        action,
        "id",
        0,
    )

    return (
        priority_rank,
        created_at is None,
        created_at,
        action_id,
    )


def convert_action_to_pdf_data(
    action: Any,
    rank: int,
) -> Dict[str, Any]:
    """
    Convert one ExecutiveAction database object into the structure
    expected by the Executive KPI PDF section builders.
    """

    return {
        "rank": rank,
        "title": _display_text(
            getattr(action, "title", None),
            "Management Action",
        ),
        "priority": _format_enum_value(
            getattr(action, "priority", None),
            "Medium",
        ),
        "linked_cause": _display_text(
            getattr(action, "linked_cause", None),
            "Not specified",
        ),
        "description": _display_text(
            getattr(action, "description", None),
            "No management action description is available.",
        ),
        "owner": _display_text(
            getattr(action, "owner", None),
            "Not assigned",
        ),
        "support_owner": "Not assigned",
        "timing": _display_text(
            getattr(action, "timing", None),
            "Not specified",
        ),
        "expected_benefit": _display_text(
            getattr(action, "expected_benefit", None),
            "No expected operational benefit is recorded.",
        ),
        "status": _format_enum_value(
            getattr(action, "status", None),
            "Open",
        ),
    }


def load_pdf_actions_for_kpi(
    db: Session,
    kpi_key: str,
    limit: int = 5,
    include_completed: bool = False,
) -> List[Dict[str, Any]]:
    """
    Load Executive Actions for one KPI and convert them into PDF-ready
    dictionaries.

    Args:
        db:
            Active SQLAlchemy database session.

        kpi_key:
            Stable KPI identifier, for example ``ore_production``.

        limit:
            Maximum number of actions to include in the PDF.

        include_completed:
            When False, only active actions are included.
            When True, completed actions may also be included.

    Returns:
        Ranked list of PDF-ready action dictionaries.
    """

    if not isinstance(limit, int):
        raise TypeError("limit must be an integer.")

    if limit < 1:
        raise ValueError("limit must be at least 1.")

    normalized_kpi_key = _normalize_kpi_key(
        kpi_key
    )

    query_limit = min(
        max(limit * 4, 20),
        500,
    )

    actions = list_actions(
        db=db,
        status=None,
        priority=None,
        kpi_key=normalized_kpi_key,
        skip=0,
        limit=query_limit,
    )

    if not include_completed:
        actions = [
            action
            for action in actions
            if getattr(
                action,
                "status",
                None,
            )
            in {
                "open",
                "in_progress",
                "blocked",
            }
        ]

    actions = sorted(
        actions,
        key=_priority_sort_key,
    )

    selected_actions = actions[:limit]

    return [
        convert_action_to_pdf_data(
            action=action,
            rank=index,
        )
        for index, action in enumerate(
            selected_actions,
            start=1,
        )
    ]