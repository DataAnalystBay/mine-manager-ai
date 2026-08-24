from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.executive_action import (
    ExecutiveAction,
)
from app.services.analytics_engine_service import (
    get_shared_analytics,
)


# ============================================================
# KPI ALIASES
# ============================================================

KPI_ALIASES = {
    # --------------------------------------------------------
    # Production
    # --------------------------------------------------------
    "ore": "production",
    "ore actual": "production",
    "ore_actual": "production",
    "ore production": "production",
    "ore_production": "production",
    "production": "production",
    "production performance": "production",
    "production_performance": "production",

    # SX-EW / copper cathode production
    "cathode": "production",
    "cathode production": "production",
    "cathode_production": "production",
    "cathode production performance": "production",
    "cathode_production_performance": "production",

    # --------------------------------------------------------
    # Waste
    # --------------------------------------------------------
    "waste": "waste",
    "waste actual": "waste",
    "waste_actual": "waste",
    "waste movement": "waste",
    "waste_movement": "waste",

    # --------------------------------------------------------
    # Fleet
    # --------------------------------------------------------
    "fleet": "fleet",
    "fleet performance": "fleet",
    "fleet_performance": "fleet",
    "fleet score": "fleet",
    "fleet_score": "fleet",

    # Legacy action keys retained for compatibility.
    "fleet availability": "fleet",
    "fleet_availability": "fleet",
    "truck availability": "fleet",
    "truck_availability": "fleet",
    "truck utilization": "fleet",
    "truck_utilization": "fleet",
    "fleet utilization": "fleet",
    "fleet_utilization": "fleet",

    # --------------------------------------------------------
    # Plant
    # --------------------------------------------------------
    "plant": "plant",
    "plant performance": "plant",
    "plant_performance": "plant",
    "plant score": "plant",
    "plant_score": "plant",
    "plant throughput": "plant",
    "plant_throughput": "plant",
    "throughput": "plant",
    "throughput achievement": "plant",
    "throughput_achievement": "plant",

    # --------------------------------------------------------
    # Recovery
    # --------------------------------------------------------
    "recovery": "recovery",
    "cu recovery": "recovery",
    "cu_recovery": "recovery",
    "copper recovery": "recovery",
    "copper_recovery": "recovery",
    "plant recovery": "recovery",
    "plant_recovery": "recovery",

    # --------------------------------------------------------
    # Safety
    # --------------------------------------------------------
    "safety": "safety",
    "safety performance": "safety",
    "safety_performance": "safety",
    "safety score": "safety",
    "safety_score": "safety",
    "safety incidents": "safety",
    "safety_incidents": "safety",
    "recordable incidents": "safety",
    "recordable_incidents": "safety",

    # --------------------------------------------------------
    # Mine Health
    # --------------------------------------------------------
    "mine health": "mine_health",
    "mine_health": "mine_health",
    "health": "mine_health",
}


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_kpi_key(
    kpi_key: Optional[str],
    kpi_name: Optional[str] = None,
) -> Optional[str]:
    """
    Convert an Executive Action KPI key or display name into
    a stable KPI Context identifier.

    The normalization intentionally supports old action keys
    such as:

        ore_production
        fleet_availability
        truck_utilization

    while routing them to the current shared analytics model.
    """

    candidates = [
        kpi_key,
        kpi_name,
    ]

    for candidate in candidates:
        if not candidate:
            continue

        normalized_value = (
            str(candidate)
            .strip()
            .lower()
            .replace("-", " ")
            .replace("_", " ")
        )

        normalized_value = " ".join(
            normalized_value.split()
        )

        if normalized_value in KPI_ALIASES:
            return KPI_ALIASES[
                normalized_value
            ]

        underscored_value = (
            normalized_value.replace(
                " ",
                "_",
            )
        )

        if underscored_value in KPI_ALIASES:
            return KPI_ALIASES[
                underscored_value
            ]

    return None


# ============================================================
# NUMERIC HELPERS
# ============================================================

def _safe_float(
    value: Any,
    default: Optional[float] = None,
) -> Optional[float]:
    """
    Convert a value to float safely.
    """

    if value is None:
        return default

    try:
        return float(value)

    except (
        TypeError,
        ValueError,
    ):
        return default


def calculate_variance(
    current_value: Optional[float],
    target_value: Optional[float],
) -> Optional[float]:
    """
    Calculate the absolute variance between current and
    target.
    """

    if (
        current_value is None
        or target_value is None
    ):
        return None

    return round(
        float(current_value)
        - float(target_value),
        2,
    )


def calculate_variance_percentage(
    current_value: Optional[float],
    target_value: Optional[float],
) -> Optional[float]:
    """
    Calculate variance as a percentage of the target.
    """

    if (
        current_value is None
        or target_value is None
    ):
        return None

    if float(target_value) == 0:
        return None

    return round(
        (
            (
                float(current_value)
                - float(target_value)
            )
            / abs(
                float(target_value)
            )
        )
        * 100,
        2,
    )


def calculate_trend(
    current_value: Optional[float],
    previous_value: Optional[float],
) -> Dict[str, Any]:
    """
    Compare the current KPI value with its previous value.
    """

    if (
        current_value is None
        or previous_value is None
    ):
        return {
            "trend_value": None,
            "trend_percentage": None,
            "trend_direction": "stable",
        }

    trend_value = round(
        float(current_value)
        - float(previous_value),
        2,
    )

    if float(previous_value) == 0:
        trend_percentage = None

    else:
        trend_percentage = round(
            (
                trend_value
                / abs(
                    float(
                        previous_value
                    )
                )
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
        "trend_value":
            trend_value,

        "trend_percentage":
            trend_percentage,

        "trend_direction":
            trend_direction,
    }


# ============================================================
# KPI STATUS
# ============================================================

def calculate_status(
    current_value: Optional[float],
    target_value: Optional[float],
    warning_threshold: Optional[float],
    critical_threshold: Optional[float],
    higher_is_better: bool,
) -> str:
    """
    Calculate KPI health using configured/default thresholds.
    """

    if current_value is None:
        return "unknown"

    current = float(
        current_value
    )

    if higher_is_better:
        if (
            critical_threshold is not None
            and current
            <= float(
                critical_threshold
            )
        ):
            return "critical"

        if (
            warning_threshold is not None
            and current
            <= float(
                warning_threshold
            )
        ):
            return "warning"

        if (
            target_value is not None
            and current
            < float(
                target_value
            )
        ):
            return "below_target"

        return "healthy"

    if (
        critical_threshold is not None
        and current
        >= float(
            critical_threshold
        )
    ):
        return "critical"

    if (
        warning_threshold is not None
        and current
        >= float(
            warning_threshold
        )
    ):
        return "warning"

    if (
        target_value is not None
        and current
        > float(
            target_value
        )
    ):
        return "above_target"

    return "healthy"


def calculate_performance_direction(
    trend_direction: str,
    higher_is_better: bool,
) -> str:
    """
    Translate numeric movement into operational performance
    direction.
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


# ============================================================
# KPI CONTEXT RESPONSE
# ============================================================

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
    last_updated: Optional[
        datetime
    ] = None,
    source: str = (
        "shared_analytics_engine"
    ),
) -> Dict[str, Any]:
    """
    Build the stable KPI Context response used by the
    Executive Actions frontend.
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
        higher_is_better=(
            higher_is_better
        ),
    )

    performance_direction = (
        calculate_performance_direction(
            trend_direction=trend[
                "trend_direction"
            ],
            higher_is_better=(
                higher_is_better
            ),
        )
    )

    resolved_last_updated = (
        last_updated
        or datetime.now(
            timezone.utc
        )
    )

    return {
        "kpi_key":
            kpi_key,

        "kpi_name":
            kpi_name,

        "category":
            category,

        "current_value":
            current_value,

        "previous_value":
            previous_value,

        "target_value":
            target_value,

        "unit":
            unit,

        "variance":
            variance,

        "variance_percentage":
            variance_percentage,

        "trend_value":
            trend[
                "trend_value"
            ],

        "trend_percentage":
            trend[
                "trend_percentage"
            ],

        "trend_direction":
            trend[
                "trend_direction"
            ],

        "performance_direction":
            performance_direction,

        "status":
            status,

        "higher_is_better":
            higher_is_better,

        "warning_threshold":
            warning_threshold,

        "critical_threshold":
            critical_threshold,

        "last_updated":
            resolved_last_updated.isoformat(),

        "source":
            source,
    }


# ============================================================
# RELATED ACTIONS
# ============================================================

def get_related_action_summary(
    db: Session,
    normalized_kpi_key: str,
    company_id: int,
    mine_id: int,
    current_action_id: Optional[
        int
    ] = None,
) -> Dict[str, Any]:
    """
    Return Executive Actions linked to the same operational
    KPI and belonging to the same tenant.

    Cross-company and cross-mine actions are never included.
    """

    query = (
        db.query(
            ExecutiveAction
        )
        .filter(
            ExecutiveAction.company_id
            == company_id,

            ExecutiveAction.mine_id
            == mine_id,
        )
    )

    # Some legacy Executive Actions use several KPI aliases
    # for the same logical metric. Normalize the action keys
    # in Python after the tenant boundary has already been
    # enforced in SQL.
    tenant_actions = query.all()

    matching_actions = []

    for action in tenant_actions:
        action_normalized_key = (
            normalize_kpi_key(
                kpi_key=(
                    action.kpi_key
                ),
                kpi_name=(
                    action.kpi_name
                ),
            )
        )

        if (
            action_normalized_key
            != normalized_kpi_key
        ):
            continue

        if (
            current_action_id
            is not None
            and action.id
            == current_action_id
        ):
            continue

        matching_actions.append(
            action
        )

    matching_actions.sort(
        key=lambda action: (
            action.created_at
            or datetime.min.replace(
                tzinfo=timezone.utc
            ),
            action.id,
        ),
        reverse=True,
    )

    active_statuses = {
        "open",
        "in_progress",
        "blocked",
    }

    active_count = sum(
        1
        for action
        in matching_actions
        if action.status
        in active_statuses
    )

    completed_count = sum(
        1
        for action
        in matching_actions
        if action.status
        == "completed"
    )

    return {
        "total":
            len(
                matching_actions
            ),

        "active":
            active_count,

        "completed":
            completed_count,

        "actions": [
            {
                "id":
                    action.id,

                "title":
                    action.title,

                "status":
                    action.status,

                "priority":
                    action.priority,

                "owner":
                    action.owner,

                "due_date": (
                    action.due_date.isoformat()
                    if action.due_date
                    else None
                ),
            }
            for action
            in matching_actions[:5]
        ],
    }


# ============================================================
# SHARED ANALYTICS HELPERS
# ============================================================

def _get_trend_card(
    analytics_data: Dict[
        str,
        Any,
    ],
    key: str,
) -> Dict[str, Any]:
    """
    Safely return one shared-analytics KPI trend card.
    """

    trend_cards = (
        analytics_data.get(
            "kpi_trend_cards",
            {},
        )
        or {}
    )

    card = trend_cards.get(
        key,
        {},
    )

    return (
        card
        if isinstance(
            card,
            dict,
        )
        else {}
    )


def _get_previous_value(
    analytics_data: Dict[
        str,
        Any,
    ],
    trend_key: str,
    current_value: Optional[
        float
    ],
) -> Optional[float]:
    """
    Resolve the previous KPI value from the shared analytics
    trend card.

    When no prior point exists, current value is used so the
    trend remains stable rather than fabricating movement.
    """

    card = _get_trend_card(
        analytics_data=(
            analytics_data
        ),
        key=trend_key,
    )

    previous_value = _safe_float(
        card.get(
            "previous_value"
        )
    )

    if previous_value is None:
        return current_value

    return previous_value


def _resolve_kpi_definition(
    analytics_data: Dict[
        str,
        Any,
    ],
    normalized_kpi_key: str,
    operation_profile: str,
) -> Optional[Dict[str, Any]]:
    """
    Convert shared analytics into one KPI Context definition.

    Applicability is controlled by the active operation
    profile. SX-EW operations therefore do not expose waste
    or fleet KPI Context.
    """

    mine_data = (
        analytics_data.get(
            "mine",
            {},
        )
        or {}
    )

    applicability = (
        mine_data.get(
            "applicability",
            {},
        )
        or {}
    )

    kpis = (
        analytics_data.get(
            "kpis",
            {},
        )
        or {}
    )

    summary = (
        analytics_data.get(
            "summary",
            {},
        )
        or {}
    )

    production = (
        kpis.get(
            "production",
            {},
        )
        or {}
    )

    fleet = (
        kpis.get(
            "fleet",
            {},
        )
        or {}
    )

    plant = (
        kpis.get(
            "plant",
            {},
        )
        or {}
    )

    safety = (
        kpis.get(
            "safety",
            {},
        )
        or {}
    )

    normalized_profile = str(
        operation_profile
        or mine_data.get(
            "operation_profile"
        )
        or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_profile
        == "sxew_copper"
    )

    # --------------------------------------------------------
    # Production
    # --------------------------------------------------------

    if normalized_kpi_key == "production":
        current_value = _safe_float(
            production.get(
                "ore_achievement"
            )
        )

        if current_value is None:
            return None

        production_label = (
            production.get(
                "production_label"
            )
            or (
                "Cathode Production"
                if is_sxew
                else "Ore Production"
            )
        )

        return {
            "kpi_key":
                "production",

            "kpi_name":
                production_label,

            "category":
                "Production",

            "current_value":
                current_value,

            "previous_value":
                _get_previous_value(
                    analytics_data=(
                        analytics_data
                    ),
                    trend_key="ore",
                    current_value=(
                        current_value
                    ),
                ),

            "target_value":
                100.0,

            "unit":
                "% of plan",

            "warning_threshold":
                95.0,

            "critical_threshold":
                90.0,

            "higher_is_better":
                True,
        }

    # --------------------------------------------------------
    # Waste
    # --------------------------------------------------------

    if normalized_kpi_key == "waste":
        if not bool(
            applicability.get(
                "waste",
                True,
            )
        ):
            return None

        current_value = _safe_float(
            production.get(
                "waste_achievement"
            )
        )

        if current_value is None:
            return None

        return {
            "kpi_key":
                "waste",

            "kpi_name":
                "Waste Movement",

            "category":
                "Production",

            "current_value":
                current_value,

            "previous_value":
                _get_previous_value(
                    analytics_data=(
                        analytics_data
                    ),
                    trend_key="waste",
                    current_value=(
                        current_value
                    ),
                ),

            "target_value":
                100.0,

            "unit":
                "% of plan",

            "warning_threshold":
                95.0,

            "critical_threshold":
                90.0,

            "higher_is_better":
                True,
        }

    # --------------------------------------------------------
    # Fleet
    # --------------------------------------------------------

    if normalized_kpi_key == "fleet":
        if not bool(
            applicability.get(
                "fleet",
                True,
            )
        ):
            return None

        if (
            fleet.get(
                "applicable",
                True,
            )
            is False
        ):
            return None

        current_value = _safe_float(
            fleet.get(
                "fleet_score"
            )
        )

        if current_value is None:
            return None

        return {
            "kpi_key":
                "fleet",

            "kpi_name":
                "Fleet Performance",

            "category":
                "Fleet",

            "current_value":
                current_value,

            "previous_value":
                _get_previous_value(
                    analytics_data=(
                        analytics_data
                    ),
                    trend_key="fleet",
                    current_value=(
                        current_value
                    ),
                ),

            "target_value":
                100.0,

            "unit":
                "%",

            "warning_threshold":
                90.0,

            "critical_threshold":
                80.0,

            "higher_is_better":
                True,
        }

    # --------------------------------------------------------
    # Plant
    # --------------------------------------------------------

    if normalized_kpi_key == "plant":
        current_value = _safe_float(
            plant.get(
                "plant_score"
            )
        )

        if current_value is None:
            return None

        return {
            "kpi_key":
                "plant",

            "kpi_name": (
                "Process Plant Performance"
                if is_sxew
                else "Plant Performance"
            ),

            "category":
                "Plant",

            "current_value":
                current_value,

            "previous_value":
                _get_previous_value(
                    analytics_data=(
                        analytics_data
                    ),
                    trend_key="plant",
                    current_value=(
                        current_value
                    ),
                ),

            "target_value":
                100.0,

            "unit":
                "%",

            "warning_threshold":
                95.0,

            "critical_threshold":
                90.0,

            "higher_is_better":
                True,
        }

    # --------------------------------------------------------
    # Recovery
    # --------------------------------------------------------

    if normalized_kpi_key == "recovery":
        current_value = _safe_float(
            plant.get(
                "recovery"
            )
        )

        if current_value is None:
            return None

        # Shared analytics currently exposes plant recovery
        # inside the plant KPI object. Until recovery receives
        # its own trend card, use the latest value as the
        # previous value so no false trend is manufactured.
        return {
            "kpi_key":
                "recovery",

            "kpi_name": (
                "Cu Recovery"
                if is_sxew
                else "Recovery"
            ),

            "category":
                "Plant",

            "current_value":
                current_value,

            "previous_value":
                current_value,

            "target_value":
                100.0,

            "unit":
                "%",

            "warning_threshold":
                90.0,

            "critical_threshold":
                85.0,

            "higher_is_better":
                True,
        }

    # --------------------------------------------------------
    # Safety
    # --------------------------------------------------------

    if normalized_kpi_key == "safety":
        current_value = _safe_float(
            safety.get(
                "safety_score"
            )
        )

        if current_value is None:
            return None

        return {
            "kpi_key":
                "safety",

            "kpi_name":
                "Safety Performance",

            "category":
                "Safety",

            "current_value":
                current_value,

            "previous_value":
                _get_previous_value(
                    analytics_data=(
                        analytics_data
                    ),
                    trend_key="safety",
                    current_value=(
                        current_value
                    ),
                ),

            "target_value":
                100.0,

            "unit":
                "%",

            "warning_threshold":
                95.0,

            "critical_threshold":
                90.0,

            "higher_is_better":
                True,
        }

    # --------------------------------------------------------
    # Mine Health
    # --------------------------------------------------------

    if normalized_kpi_key == "mine_health":
        current_value = _safe_float(
            summary.get(
                "mine_health"
            )
        )

        if current_value is None:
            return None

        return {
            "kpi_key":
                "mine_health",

            "kpi_name":
                "Mine Health",

            "category":
                "Executive",

            "current_value":
                current_value,

            "previous_value":
                _get_previous_value(
                    analytics_data=(
                        analytics_data
                    ),
                    trend_key=(
                        "mine_health"
                    ),
                    current_value=(
                        current_value
                    ),
                ),

            "target_value":
                100.0,

            "unit":
                "%",

            "warning_threshold":
                90.0,

            "critical_threshold":
                80.0,

            "higher_is_better":
                True,
        }

    return None


# ============================================================
# LIVE KPI CONTEXT
# ============================================================

def get_live_kpi_context(
    db: Session,
    kpi_key: Optional[str],
    kpi_name: Optional[str] = None,
    company_id: Optional[
        int
    ] = None,
    mine_id: Optional[
        int
    ] = None,
    mine_name: Optional[
        str
    ] = None,
    operation_profile: str = (
        "standard_mine"
    ),
    current_action_id: Optional[
        int
    ] = None,
) -> Optional[Dict[str, Any]]:
    """
    Return live, tenant-aware KPI Context for an Executive
    Action.

    Tenant boundary:
        company_id + mine_id

    KPI values:
        shared analytics engine

    Operation applicability:
        operation_profile

    Related Executive Actions:
        same company + same mine only
    """

    if (
        company_id is None
        or mine_id is None
    ):
        return None

    resolved_mine_name = str(
        mine_name or ""
    ).strip()

    if not resolved_mine_name:
        return None

    normalized_key = normalize_kpi_key(
        kpi_key=kpi_key,
        kpi_name=kpi_name,
    )

    if not normalized_key:
        return None

    normalized_operation_profile = str(
        operation_profile
        or "standard_mine"
    ).strip().lower()

    analytics_data = get_shared_analytics(
        db=db,
        mine_name=resolved_mine_name,
        days=7,
        company_id=company_id,
        mine_id=mine_id,
        operation_profile=(
            normalized_operation_profile
        ),
    )

    summary = (
        analytics_data.get(
            "summary",
            {},
        )
        or {}
    )

    if (
        summary.get(
            "status"
        )
        not in {
            "available",
            "success",
        }
    ):
        return None

    kpi_definition = (
        _resolve_kpi_definition(
            analytics_data=(
                analytics_data
            ),
            normalized_kpi_key=(
                normalized_key
            ),
            operation_profile=(
                normalized_operation_profile
            ),
        )
    )

    if not kpi_definition:
        return None

    metadata = (
        analytics_data.get(
            "metadata",
            {},
        )
        or {}
    )

    generated_at = metadata.get(
        "generated_at"
    )

    last_updated = None

    if generated_at:
        try:
            last_updated = (
                datetime.fromisoformat(
                    str(
                        generated_at
                    ).replace(
                        "Z",
                        "+00:00",
                    )
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            last_updated = None

    context = build_kpi_context(
        kpi_key=(
            kpi_definition[
                "kpi_key"
            ]
        ),
        kpi_name=(
            kpi_definition[
                "kpi_name"
            ]
        ),
        category=(
            kpi_definition[
                "category"
            ]
        ),
        current_value=(
            kpi_definition[
                "current_value"
            ]
        ),
        previous_value=(
            kpi_definition[
                "previous_value"
            ]
        ),
        target_value=(
            kpi_definition[
                "target_value"
            ]
        ),
        unit=(
            kpi_definition[
                "unit"
            ]
        ),
        warning_threshold=(
            kpi_definition[
                "warning_threshold"
            ]
        ),
        critical_threshold=(
            kpi_definition[
                "critical_threshold"
            ]
        ),
        higher_is_better=(
            kpi_definition[
                "higher_is_better"
            ]
        ),
        last_updated=(
            last_updated
        ),
        source=(
            "shared_analytics_engine"
        ),
    )

    context[
        "operation_profile"
    ] = (
        normalized_operation_profile
    )

    context[
        "tenant"
    ] = {
        "company_id":
            company_id,

        "mine_id":
            mine_id,

        "mine_name":
            resolved_mine_name,
    }

    context[
        "related_actions"
    ] = (
        get_related_action_summary(
            db=db,
            normalized_kpi_key=(
                normalized_key
            ),
            company_id=company_id,
            mine_id=mine_id,
            current_action_id=(
                current_action_id
            ),
        )
    )

    return context