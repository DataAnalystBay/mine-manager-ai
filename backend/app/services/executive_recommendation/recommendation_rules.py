from typing import Any, Dict, List, Optional


# ============================================================
# Helper functions
# ============================================================


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Safely convert a value into a float.
    """

    if value is None:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalise_key(value: Optional[str]) -> str:
    """
    Convert labels into a stable lowercase key.
    """

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
    """
    Calculate KPI variance against target.

    Example:
        current = 96
        target = 100

        variance = -4.0%
    """

    if target_value == 0:
        return 0.0

    return round(
        ((current_value - target_value) / target_value) * 100,
        1,
    )


def _build_action(
    rank: int,
    title: str,
    description: str,
    priority: str,
    owner: str,
    timing: str,
    expected_benefit: str,
    linked_cause: str,
    status: str = "Open",
) -> Dict[str, Any]:
    """
    Build an action compatible with the existing
    Executive Action Plan PDF structure.
    """

    return {
        "rank": rank,
        "title": title,
        "description": description,
        "priority": priority,
        "owner": owner,
        "timing": timing,
        "expected_benefit": expected_benefit,
        "linked_cause": linked_cause,
        "status": status,
    }


# ============================================================
# Ore production recommendation rules
# ============================================================


def _ore_production_rules(
    current_value: float,
    target_value: float,
    context: Dict[str, Any],
) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []

    truck_availability = _safe_float(
        context.get("truck_availability")
    )

    truck_utilisation = _safe_float(
        context.get("truck_utilisation")
        or context.get("truck_utilization")
    )

    shovel_availability = _safe_float(
        context.get("shovel_availability")
    )

    backlog_tonnes = _safe_float(
        context.get("backlog_tonnes")
    )

    active_pit = (
        context.get("active_pit")
        or context.get("priority_pit")
        or "the priority mining area"
    )

    variance_percent = _calculate_variance_percent(
        current_value=current_value,
        target_value=target_value,
    )

    if truck_availability and truck_availability < 90:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Restore truck availability above 90%",
                description=(
                    "Prioritise return-to-service activities for "
                    "production-critical haul trucks and review "
                    "extended maintenance delays."
                ),
                priority="Critical",
                owner="Maintenance Superintendent",
                timing="Next shift",
                expected_benefit=(
                    "Recover haulage capacity and improve ore "
                    "movement against plan."
                ),
                linked_cause="Reduced truck availability",
            )
        )

    if truck_utilisation and truck_utilisation < 85:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Increase truck utilisation through dispatch control",
                description=(
                    "Review queue time, loading delays, route balance, "
                    "and shift-change losses with dispatch supervision."
                ),
                priority="High",
                owner="Mining Superintendent",
                timing="Within 4 hours",
                expected_benefit=(
                    "Increase productive haulage hours and reduce "
                    "avoidable cycle-time losses."
                ),
                linked_cause="Low truck utilisation",
            )
        )

    if shovel_availability and shovel_availability < 90:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Stabilise shovel availability",
                description=(
                    "Confirm shovel maintenance constraints, standby "
                    "equipment readiness, and truck allocation to the "
                    "available loading units."
                ),
                priority="High",
                owner="Maintenance Superintendent",
                timing="Next shift",
                expected_benefit=(
                    "Protect loading capacity and reduce truck idle time."
                ),
                linked_cause="Reduced shovel availability",
            )
        )

    actions.append(
        _build_action(
            rank=len(actions) + 1,
            title=f"Increase ore movement from {active_pit}",
            description=(
                "Review the next 24-hour mining sequence and redirect "
                "available loading and haulage capacity toward the "
                "highest-priority ore source."
            ),
            priority="High",
            owner="Mining Superintendent",
            timing="Next shift",
            expected_benefit=(
                "Improve ore delivery and reduce the current "
                f"{abs(variance_percent):.1f}% production gap."
            ),
            linked_cause="Ore movement below plan",
        )
    )

    if backlog_tonnes > 0:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Prepare a production backlog recovery plan",
                description=(
                    "Quantify the recoverable backlog and define the "
                    "required tonnes per shift for the next operating period."
                ),
                priority="High",
                owner="Technical Services Manager",
                timing="Before next planning review",
                expected_benefit=(
                    "Reduce schedule slippage and clarify the required "
                    "recovery rate."
                ),
                linked_cause="Accumulated production backlog",
            )
        )

    actions.append(
        _build_action(
            rank=len(actions) + 1,
            title="Monitor production recovery every four hours",
            description=(
                "Track ore tonnes, truck availability, utilisation, "
                "shovel performance, and remaining production variance."
            ),
            priority="Medium",
            owner="Operations Control Room",
            timing="Every 4 hours",
            expected_benefit=(
                "Provide early warning if recovery actions are not "
                "delivering the expected result."
            ),
            linked_cause="Production recovery uncertainty",
        )
    )

    return actions[:5]


# ============================================================
# Fleet recommendation rules
# ============================================================


def _fleet_rules(
    current_value: float,
    target_value: float,
    context: Dict[str, Any],
) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []

    utilisation = _safe_float(
        context.get("truck_utilisation")
        or context.get("truck_utilization")
    )

    maintenance_delay_hours = _safe_float(
        context.get("maintenance_delay_hours")
    )

    actions.append(
        _build_action(
            rank=1,
            title="Recover production-critical fleet availability",
            description=(
                "Prioritise equipment with the highest production impact "
                "and review all extended downtime events."
            ),
            priority="Critical",
            owner="Maintenance Superintendent",
            timing="Next shift",
            expected_benefit=(
                "Increase available haulage capacity and reduce "
                "production exposure."
            ),
            linked_cause="Fleet availability below target",
        )
    )

    if utilisation and utilisation < 85:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Reduce fleet idle and queue time",
                description=(
                    "Review dispatch assignments, loading queues, "
                    "shift-change delays, and route congestion."
                ),
                priority="High",
                owner="Mining Superintendent",
                timing="Within 4 hours",
                expected_benefit=(
                    "Improve productive fleet hours without adding equipment."
                ),
                linked_cause="Low fleet utilisation",
            )
        )

    if maintenance_delay_hours > 0:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Escalate delayed maintenance work orders",
                description=(
                    "Review parts, labour, contractor, and approval "
                    "constraints affecting equipment return-to-service."
                ),
                priority="High",
                owner="Maintenance Manager",
                timing="Immediately",
                expected_benefit=(
                    "Shorten equipment downtime and improve fleet readiness."
                ),
                linked_cause="Maintenance execution delays",
            )
        )

    actions.append(
        _build_action(
            rank=len(actions) + 1,
            title="Review next-shift equipment allocation",
            description=(
                "Match available equipment to the highest-priority "
                "production areas and confirm standby coverage."
            ),
            priority="Medium",
            owner="Mining Superintendent",
            timing="Before next shift",
            expected_benefit=(
                "Protect critical production activities despite "
                "fleet constraints."
            ),
            linked_cause="Constrained equipment capacity",
        )
    )

    return actions[:5]


# ============================================================
# Plant recommendation rules
# ============================================================


def _plant_rules(
    current_value: float,
    target_value: float,
    context: Dict[str, Any],
) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []

    plant_availability = _safe_float(
        context.get("plant_availability")
    )

    recovery = _safe_float(
        context.get("recovery")
        or context.get("plant_recovery")
    )

    feed_rate = _safe_float(
        context.get("feed_rate")
    )

    actions.append(
        _build_action(
            rank=1,
            title="Stabilise plant throughput against target",
            description=(
                "Review the main throughput constraint and confirm "
                "the operating plan for the next shift."
            ),
            priority="High",
            owner="Processing Superintendent",
            timing="Next shift",
            expected_benefit=(
                "Recover plant output and reduce daily production variance."
            ),
            linked_cause="Plant throughput below target",
        )
    )

    if plant_availability and plant_availability < 90:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Restore plant availability above 90%",
                description=(
                    "Prioritise critical maintenance and inspect recurring "
                    "downtime causes affecting plant operating hours."
                ),
                priority="Critical",
                owner="Maintenance Superintendent",
                timing="Immediately",
                expected_benefit=(
                    "Increase available processing hours."
                ),
                linked_cause="Low plant availability",
            )
        )

    if recovery and recovery < target_value:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Review metallurgical recovery losses",
                description=(
                    "Assess ore characteristics, reagent performance, "
                    "grind size, residence time, and operating stability."
                ),
                priority="High",
                owner="Metallurgy Superintendent",
                timing="Within 24 hours",
                expected_benefit=(
                    "Reduce metal loss and improve recovered production."
                ),
                linked_cause="Recovery below target",
            )
        )

    if feed_rate:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Optimise feed rate within operating limits",
                description=(
                    "Balance throughput against recovery, equipment "
                    "constraints, and downstream stability."
                ),
                priority="Medium",
                owner="Processing Superintendent",
                timing="Next shift",
                expected_benefit=(
                    "Improve stable throughput without increasing process risk."
                ),
                linked_cause="Feed-rate constraint",
            )
        )

    return actions[:5]


# ============================================================
# Safety recommendation rules
# ============================================================


def _safety_rules(
    current_value: float,
    target_value: float,
    context: Dict[str, Any],
) -> List[Dict[str, Any]]:
    actions: List[Dict[str, Any]] = []

    incident_count = _safe_float(
        context.get("incident_count"),
        current_value,
    )

    high_potential_count = _safe_float(
        context.get("high_potential_count")
    )

    if high_potential_count > 0:
        actions.append(
            _build_action(
                rank=1,
                title="Initiate high-potential incident response",
                description=(
                    "Confirm immediate controls, preserve evidence, "
                    "assign investigation leadership, and communicate "
                    "critical learnings."
                ),
                priority="Critical",
                owner="Health and Safety Manager",
                timing="Immediately",
                expected_benefit=(
                    "Prevent recurrence and reduce exposure to serious harm."
                ),
                linked_cause="High-potential safety event",
            )
        )

    if incident_count > 0:
        actions.append(
            _build_action(
                rank=len(actions) + 1,
                title="Verify critical controls across affected work areas",
                description=(
                    "Conduct field verification of controls linked to the "
                    "incident type and stop work where controls are ineffective."
                ),
                priority="Critical",
                owner="Operations Manager",
                timing="Before work resumes",
                expected_benefit=(
                    "Reduce immediate safety exposure."
                ),
                linked_cause="Safety incident occurrence",
            )
        )

    actions.append(
        _build_action(
            rank=len(actions) + 1,
            title="Share incident learning with operational teams",
            description=(
                "Deliver a focused pre-start communication covering the "
                "event, failed controls, and required corrective actions."
            ),
            priority="High",
            owner="Area Superintendent",
            timing="Next pre-start meeting",
            expected_benefit=(
                "Increase awareness and strengthen control compliance."
            ),
            linked_cause="Potential recurrence risk",
        )
    )

    return actions[:5]


# ============================================================
# Generic fallback rules
# ============================================================


def _generic_rules(
    kpi_name: str,
    current_value: float,
    target_value: float,
    context: Dict[str, Any],
) -> List[Dict[str, Any]]:
    variance_percent = _calculate_variance_percent(
        current_value=current_value,
        target_value=target_value,
    )

    return [
        _build_action(
            rank=1,
            title=f"Recover {kpi_name} performance",
            description=(
                f"Review the operational drivers causing {kpi_name} "
                "to remain outside the expected performance range."
            ),
            priority="High",
            owner="Area Superintendent",
            timing="Next shift",
            expected_benefit=(
                f"Reduce the current {abs(variance_percent):.1f}% "
                "variance against target."
            ),
            linked_cause=f"{kpi_name} below target",
        ),
        _build_action(
            rank=2,
            title=f"Validate the {kpi_name} recovery plan",
            description=(
                "Confirm actions, owners, timing, constraints, and "
                "expected operational impact."
            ),
            priority="Medium",
            owner="Operations Manager",
            timing="Within 24 hours",
            expected_benefit=(
                "Improve accountability and management visibility."
            ),
            linked_cause="Performance recovery uncertainty",
        ),
        _build_action(
            rank=3,
            title=f"Monitor {kpi_name} at increased frequency",
            description=(
                "Track performance during the next operating period "
                "and escalate further deterioration."
            ),
            priority="Medium",
            owner="Operations Control Room",
            timing="Every 4 hours",
            expected_benefit=(
                "Provide early warning and support timely intervention."
            ),
            linked_cause="Ongoing KPI performance risk",
        ),
    ]


# ============================================================
# Public rule-selection function
# ============================================================


def generate_recommendation_actions(
    kpi_key: str,
    kpi_name: str,
    current_value: Any,
    target_value: Any,
    context: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Generate structured executive actions from KPI performance.

    The output is compatible with the existing PDF functions:

        build_recommended_actions(...)
        build_executive_action_plan(...)

    Parameters
    ----------
    kpi_key:
        Stable KPI identifier such as ore_production.

    kpi_name:
        Human-readable KPI name.

    current_value:
        Current KPI result.

    target_value:
        KPI target.

    context:
        Optional related operational values such as:
            truck_availability
            truck_utilisation
            shovel_availability
            backlog_tonnes
            active_pit
    """

    normalized_key = _normalise_key(kpi_key)

    current = _safe_float(current_value)
    target = _safe_float(target_value)

    operational_context = context or {}

    if normalized_key in {
        "ore_production",
        "ore_actual",
        "ore_tonnes",
        "production",
    }:
        return _ore_production_rules(
            current_value=current,
            target_value=target,
            context=operational_context,
        )

    if normalized_key in {
        "fleet_availability",
        "truck_availability",
        "fleet_performance",
        "truck_utilisation",
        "truck_utilization",
    }:
        return _fleet_rules(
            current_value=current,
            target_value=target,
            context=operational_context,
        )

    if normalized_key in {
        "plant_throughput",
        "plant_availability",
        "plant_recovery",
        "recovery",
        "processing",
    }:
        return _plant_rules(
            current_value=current,
            target_value=target,
            context=operational_context,
        )

    if normalized_key in {
        "safety",
        "safety_incidents",
        "incident_count",
        "high_potential_incidents",
    }:
        return _safety_rules(
            current_value=current,
            target_value=target,
            context=operational_context,
        )

    return _generic_rules(
        kpi_name=kpi_name or "KPI",
        current_value=current,
        target_value=target,
        context=operational_context,
    )
