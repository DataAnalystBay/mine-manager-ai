from typing import Any, Dict, List, Optional

from app.services.executive_recommendation.recommendation_rules import (
    generate_recommendation_actions,
)


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    if value is None:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalise_key(value: Optional[str]) -> str:
    if not value:
        return ""

    return (
        value.strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def _calculate_variance_percent(
    current_value: float,
    target_value: float,
) -> float:
    if target_value == 0:
        return 0.0

    return round(
        ((current_value - target_value) / target_value) * 100,
        1,
    )


def _build_situation_statement(
    kpi_name: str,
    current_value: float,
    target_value: float,
    variance_percent: float,
    primary_cause: str,
) -> str:
    if variance_percent < 0:
        return (
            f"{kpi_name} remains {abs(variance_percent):.1f}% below target "
            f"due primarily to {primary_cause.lower()}."
        )

    if variance_percent > 0:
        return (
            f"{kpi_name} is {variance_percent:.1f}% above target; however, "
            f"management attention remains focused on "
            f"{primary_cause.lower()}."
        )

    return (
        f"{kpi_name} is currently on target. "
        f"The main operational focus remains "
        f"{primary_cause.lower()}."
    )


def _estimate_recovery_percent(
    kpi_key: str,
    variance_percent: float,
    actions: List[Dict[str, Any]],
    context: Dict[str, Any],
) -> float:
    normalized_key = _normalise_key(kpi_key)

    if variance_percent >= 0:
        return 0.0

    gap = abs(variance_percent)

    recovery_factor = 0.50

    critical_actions = sum(
        1
        for action in actions
        if str(action.get("priority", "")).lower() == "critical"
    )

    high_actions = sum(
        1
        for action in actions
        if str(action.get("priority", "")).lower() == "high"
    )

    recovery_factor += min(
        critical_actions * 0.10,
        0.20,
    )

    recovery_factor += min(
        high_actions * 0.05,
        0.15,
    )

    truck_availability = _safe_float(
        context.get("truck_availability")
    )

    truck_utilisation = _safe_float(
        context.get("truck_utilisation")
        or context.get("truck_utilization")
    )

    if normalized_key in {
        "ore_production",
        "ore_actual",
        "ore_tonnes",
        "production",
    }:
        if 0 < truck_availability < 90:
            recovery_factor += 0.05

        if 0 < truck_utilisation < 85:
            recovery_factor += 0.05

    recovery_factor = min(
        recovery_factor,
        0.85,
    )

    estimated_recovery = gap * recovery_factor

    return round(
        min(estimated_recovery, gap),
        1,
    )


def _build_backlog_outlook(
    context: Dict[str, Any],
    estimated_recovery_percent: float,
) -> str:
    backlog_tonnes = _safe_float(
        context.get("backlog_tonnes")
    )

    if backlog_tonnes <= 0:
        return "Stable"

    if estimated_recovery_percent >= 3:
        return "Expected to reduce"

    if estimated_recovery_percent > 0:
        return "Partially recoverable"

    return "At risk of increasing"


def _build_schedule_risk(
    variance_percent: float,
    estimated_recovery_percent: float,
    actions: List[Dict[str, Any]],
) -> Dict[str, str]:
    current_gap = abs(min(variance_percent, 0))

    remaining_gap = max(
        current_gap - estimated_recovery_percent,
        0,
    )

    has_critical_action = any(
        str(action.get("priority", "")).lower() == "critical"
        for action in actions
    )

    if current_gap >= 8 or has_critical_action:
        current_risk = "High"
    elif current_gap >= 3:
        current_risk = "Medium"
    else:
        current_risk = "Low"

    if remaining_gap >= 6:
        expected_risk = "High"
    elif remaining_gap >= 2:
        expected_risk = "Medium"
    else:
        expected_risk = "Low"

    return {
        "current": current_risk,
        "expected": expected_risk,
    }


def _build_expected_result(
    estimated_recovery_percent: float,
    backlog_outlook: str,
    schedule_risk: Dict[str, str],
) -> Dict[str, Any]:
    if estimated_recovery_percent > 0:
        recovery_text = f"+{estimated_recovery_percent:.1f}%"
    else:
        recovery_text = "Maintain current performance"

    return {
        "estimated_recovery_percent": estimated_recovery_percent,
        "estimated_recovery": recovery_text,
        "backlog_outlook": backlog_outlook,
        "schedule_risk_current": schedule_risk["current"],
        "schedule_risk_expected": schedule_risk["expected"],
        "schedule_risk_change": (
            f"{schedule_risk['current']} → "
            f"{schedule_risk['expected']}"
        ),
    }


def generate_executive_recommendation(
    kpi_key: str,
    kpi_name: str,
    current_value: Any,
    target_value: Any,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generate a structured executive decision brief.

    This combines KPI performance, operational context,
    and rule-generated actions into one reusable object.
    """

    current = _safe_float(current_value)
    target = _safe_float(target_value)

    operational_context = context or {}

    variance_percent = _calculate_variance_percent(
        current_value=current,
        target_value=target,
    )

    actions = generate_recommendation_actions(
        kpi_key=kpi_key,
        kpi_name=kpi_name,
        current_value=current,
        target_value=target,
        context=operational_context,
    )

    primary_cause = (
        actions[0].get("linked_cause")
        if actions
        else "operational performance constraints"
    )

    situation = _build_situation_statement(
        kpi_name=kpi_name,
        current_value=current,
        target_value=target,
        variance_percent=variance_percent,
        primary_cause=primary_cause,
    )

    estimated_recovery_percent = _estimate_recovery_percent(
        kpi_key=kpi_key,
        variance_percent=variance_percent,
        actions=actions,
        context=operational_context,
    )

    backlog_outlook = _build_backlog_outlook(
        context=operational_context,
        estimated_recovery_percent=estimated_recovery_percent,
    )

    schedule_risk = _build_schedule_risk(
        variance_percent=variance_percent,
        estimated_recovery_percent=estimated_recovery_percent,
        actions=actions,
    )

    expected_result = _build_expected_result(
        estimated_recovery_percent=estimated_recovery_percent,
        backlog_outlook=backlog_outlook,
        schedule_risk=schedule_risk,
    )

    return {
        "kpi_key": _normalise_key(kpi_key),
        "kpi_name": kpi_name,
        "current_value": current,
        "target_value": target,
        "variance_percent": variance_percent,
        "recommendation_title": (
            f"Recover {kpi_name} performance during the next shift"
            if variance_percent < 0
            else f"Protect and sustain {kpi_name} performance"
        ),
        "situation": situation,
        "primary_cause": primary_cause,
        "priority_actions": actions,
        "expected_result": expected_result,
        "decision_window": "Next shift",
        "monitoring_frequency": "Every 4 hours",
        "engine_version": "1.0",
    }
