from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.executive_action import ExecutiveAction


KPI_ALIASES = {
    "ore": "ore_production",
    "ore_actual": "ore_production",
    "ore production": "ore_production",
    "ore_production": "ore_production",

    "waste": "waste_movement",
    "waste actual": "waste_movement",
    "waste_movement": "waste_movement",

    "fleet": "truck_utilization",
    "fleet utilization": "truck_utilization",
    "truck utilization": "truck_utilization",
    "truck_utilization": "truck_utilization",

    "fleet availability": "fleet_availability",
    "truck availability": "fleet_availability",
    "fleet_availability": "fleet_availability",

    "plant": "plant_throughput",
    "plant throughput": "plant_throughput",
    "plant_throughput": "plant_throughput",

    "safety": "safety_incidents",
    "safety incidents": "safety_incidents",
    "recordable incidents": "safety_incidents",
    "safety_incidents": "safety_incidents",
}


TEMPORARY_KPI_DATA = {
    "ore_production": {
        "kpi_key": "ore_production",
        "kpi_name": "Ore Production",
        "category": "Production",
        "current_value": 96.0,
        "previous_value": 98.0,
        "target_value": 100.0,
        "unit": "% of plan",
        "warning_threshold": 95.0,
        "critical_threshold": 90.0,
        "higher_is_better": True,
    },
    "waste_movement": {
        "kpi_key": "waste_movement",
        "kpi_name": "Waste Movement",
        "category": "Production",
        "current_value": 93.0,
        "previous_value": 95.0,
        "target_value": 100.0,
        "unit": "% of plan",
        "warning_threshold": 95.0,
        "critical_threshold": 90.0,
        "higher_is_better": True,
    },
    "truck_utilization": {
        "kpi_key": "truck_utilization",
        "kpi_name": "Truck Utilization",
        "category": "Fleet",
        "current_value": 76.0,
        "previous_value": 80.2,
        "target_value": 85.0,
        "unit": "%",
        "warning_threshold": 80.0,
        "critical_threshold": 75.0,
        "higher_is_better": True,
    },
    "fleet_availability": {
        "kpi_key": "fleet_availability",
        "kpi_name": "Fleet Availability",
        "category": "Fleet",
        "current_value": 88.0,
        "previous_value": 89.5,
        "target_value": 92.0,
        "unit": "%",
        "warning_threshold": 88.0,
        "critical_threshold": 82.0,
        "higher_is_better": True,
    },
    "plant_throughput": {
        "kpi_key": "plant_throughput",
        "kpi_name": "Plant Throughput",
        "category": "Plant",
        "current_value": 97.0,
        "previous_value": 99.0,
        "target_value": 100.0,
        "unit": "% of target",
        "warning_threshold": 95.0,
        "critical_threshold": 90.0,
        "higher_is_better": True,
    },
    "safety_incidents": {
        "kpi_key": "safety_incidents",
        "kpi_name": "Safety Incidents",
        "category": "Safety",
        "current_value": 0.0,
        "previous_value": 0.0,
        "target_value": 0.0,
        "unit": "incidents",
        "warning_threshold": 1.0,
        "critical_threshold": 2.0,
        "higher_is_better": False,
    },
}


def normalize_kpi_key(
    kpi_key: Optional[str],
    kpi_name: Optional[str] = None,
) -> Optional[str]:
    """
    Convert KPI keys or display names into a stable internal KPI key.
    """

    candidates = [
        kpi_key,
        kpi_name,
    ]

    for candidate in candidates:
        if not candidate:
            continue

        normalized_value = (
            candidate.strip()
            .lower()
            .replace("-", " ")
            .replace("_", " ")
        )

        normalized_value = " ".join(
            normalized_value.split()
        )

        if normalized_value in KPI_ALIASES:
            return KPI_ALIASES[normalized_value]

        underscored_value = normalized_value.replace(
            " ",
            "_",
        )

        if underscored_value in TEMPORARY_KPI_DATA:
            return underscored_value

    return None


def calculate_variance(
    current_value: Optional[float],
    target_value: Optional[float],
) -> Optional[float]:
    """
    Calculate the absolute variance between current and target.
    """

    if current_value is None or target_value is None:
        return None

    return round(
        float(current_value) - float(target_value),
        2,
    )


def calculate_variance_percentage(
    current_value: Optional[float],
    target_value: Optional[float],
) -> Optional[float]:
    """
    Calculate variance as a percentage of the target.
    """

    if current_value is None or target_value is None:
        return None

    if float(target_value) == 0:
        return None

    return round(
        (
            (
                float(current_value)
                - float(target_value)
            )
            / abs(float(target_value))
        )
        * 100,
        2,
    )


def calculate_trend(
    current_value: Optional[float],
    previous_value: Optional[float],
) -> Dict[str, Any]:
    """
    Compare the current KPI value with the previous value.
    """

    if current_value is None or previous_value is None:
        return {
            "trend_value": None,
            "trend_percentage": None,
            "trend_direction": "stable",
        }

    trend_value = round(
        float(current_value) - float(previous_value),
        2,
    )

    if float(previous_value) == 0:
        trend_percentage = None
    else:
        trend_percentage = round(
            (
                trend_value
                / abs(float(previous_value))
            )
            * 100,
            2,
        )

    if trend_value > 0:
        trend_direction = "up"
    elif trend_value < 0:
        trend_direction = "down"
    else:
        trend_direction = "stable"

    return {
        "trend_value": trend_value,
        "trend_percentage": trend_percentage,
        "trend_direction": trend_direction,
    }


def calculate_status(
    current_value: Optional[float],
    target_value: Optional[float],
    warning_threshold: Optional[float],
    critical_threshold: Optional[float],
    higher_is_better: bool,
) -> str:
    """
    Calculate KPI health using configured thresholds.
    """

    if current_value is None:
        return "unknown"

    current = float(current_value)

    if higher_is_better:
        if (
            critical_threshold is not None
            and current <= float(critical_threshold)
        ):
            return "critical"

        if (
            warning_threshold is not None
            and current <= float(warning_threshold)
        ):
            return "warning"

        if (
            target_value is not None
            and current < float(target_value)
        ):
            return "below_target"

        return "healthy"

    if (
        critical_threshold is not None
        and current >= float(critical_threshold)
    ):
        return "critical"

    if (
        warning_threshold is not None
        and current >= float(warning_threshold)
    ):
        return "warning"

    if (
        target_value is not None
        and current > float(target_value)
    ):
        return "above_target"

    return "healthy"


def calculate_performance_direction(
    trend_direction: str,
    higher_is_better: bool,
) -> str:
    """
    Translate numeric movement into operational performance direction.

    Example:
    - Utilization moving up is improving.
    - Safety incidents moving up is deteriorating.
    """

    if trend_direction == "stable":
        return "stable"

    if higher_is_better:
        if trend_direction == "up":
            return "improving"

        return "deteriorating"

    if trend_direction == "down":
        return "improving"

    return "deteriorating"


def build_kpi_context(
    kpi_key: str,
    kpi_name: str,
    category: str,
    current_value: Optional[float],
    previous_value: Optional[float],
    target_value: Optional[float],
    unit: str,
    warning_threshold: Optional[float],
    critical_threshold: Optional[float],
    higher_is_better: bool,
    last_updated: Optional[datetime] = None,
    source: str = "temporary_demo_data",
) -> Dict[str, Any]:
    """
    Build a consistent response for the frontend.
    """

    variance = calculate_variance(
        current_value=current_value,
        target_value=target_value,
    )

    variance_percentage = (
        calculate_variance_percentage(
            current_value=current_value,
            target_value=target_value,
        )
    )

    trend = calculate_trend(
        current_value=current_value,
        previous_value=previous_value,
    )

    status = calculate_status(
        current_value=current_value,
        target_value=target_value,
        warning_threshold=warning_threshold,
        critical_threshold=critical_threshold,
        higher_is_better=higher_is_better,
    )

    performance_direction = (
        calculate_performance_direction(
            trend_direction=trend[
                "trend_direction"
            ],
            higher_is_better=higher_is_better,
        )
    )

    resolved_last_updated = (
        last_updated
        or datetime.now(timezone.utc)
    )

    return {
        "kpi_key": kpi_key,
        "kpi_name": kpi_name,
        "category": category,
        "current_value": current_value,
        "previous_value": previous_value,
        "target_value": target_value,
        "unit": unit,
        "variance": variance,
        "variance_percentage": variance_percentage,
        "trend_value": trend["trend_value"],
        "trend_percentage": trend[
            "trend_percentage"
        ],
        "trend_direction": trend[
            "trend_direction"
        ],
        "performance_direction": (
            performance_direction
        ),
        "status": status,
        "higher_is_better": higher_is_better,
        "warning_threshold": warning_threshold,
        "critical_threshold": critical_threshold,
        "last_updated": (
            resolved_last_updated.isoformat()
        ),
        "source": source,
    }

def get_related_action_summary(
    db: Session,
    normalized_kpi_key: str,
    current_action_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Return executive actions linked to the same operational KPI.

    The currently opened action is excluded. Summary counts include
    every matching action, while the response includes at most the
    five most recently created related actions.
    """

    query = db.query(ExecutiveAction).filter(
        ExecutiveAction.kpi_key == normalized_kpi_key,
    )

    if current_action_id is not None:
        query = query.filter(
            ExecutiveAction.id != current_action_id,
        )

    related_actions = (
        query
        .order_by(
            ExecutiveAction.created_at.desc(),
            ExecutiveAction.id.desc(),
        )
        .all()
    )

    active_statuses = {
        "open",
        "in_progress",
        "blocked",
    }

    active_count = sum(
        1
        for action in related_actions
        if action.status in active_statuses
    )

    completed_count = sum(
        1
        for action in related_actions
        if action.status == "completed"
    )

    return {
        "total": len(related_actions),
        "active": active_count,
        "completed": completed_count,
        "actions": [
            {
                "id": action.id,
                "title": action.title,
                "status": action.status,
                "priority": action.priority,
                "owner": action.owner,
                "due_date": (
                    action.due_date.isoformat()
                    if action.due_date
                    else None
                ),
            }
            for action in related_actions[:5]
        ],
    }


def get_live_kpi_context(
    db: Session,
    kpi_key: Optional[str],
    kpi_name: Optional[str] = None,
    mine_id: Optional[int] = None,
    current_action_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieve live KPI context.

    Sprint 10.11.6 implementation:
    Uses temporary KPI data for the KPI values and queries the
    executive_actions table for related actions.

    A later refinement will replace TEMPORARY_KPI_DATA with queries
    against Production, Fleet, Plant, Safety, and KPI Target tables.
    """

    del mine_id

    normalized_key = normalize_kpi_key(
        kpi_key=kpi_key,
        kpi_name=kpi_name,
    )

    if not normalized_key:
        return None

    kpi_data = TEMPORARY_KPI_DATA.get(
        normalized_key
    )

    if not kpi_data:
        return None

    context = build_kpi_context(
        kpi_key=kpi_data["kpi_key"],
        kpi_name=kpi_data["kpi_name"],
        category=kpi_data["category"],
        current_value=kpi_data[
            "current_value"
        ],
        previous_value=kpi_data[
            "previous_value"
        ],
        target_value=kpi_data[
            "target_value"
        ],
        unit=kpi_data["unit"],
        warning_threshold=kpi_data[
            "warning_threshold"
        ],
        critical_threshold=kpi_data[
            "critical_threshold"
        ],
        higher_is_better=kpi_data[
            "higher_is_better"
        ],
    )

    context["related_actions"] = (
        get_related_action_summary(
            db=db,
            normalized_kpi_key=normalized_key,
            current_action_id=current_action_id,
        )
    )

    return context
