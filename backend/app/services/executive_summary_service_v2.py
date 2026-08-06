from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.services.ai.kpi_engine import get_kpi_intelligence
from app.services.demo_data_service import generate_all_demo_data
from app.services.trend_engine_service import (
    get_trend_analysis_service,
)


# --------------------------------------------------
# Constants
# --------------------------------------------------

DEFAULT_REPORTING_PERIOD = "Available reporting period"

SEVERITY_ORDER = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

SUPPORTED_DEMO_SCENARIOS = {
    "Fleet Breakdown",
}


# --------------------------------------------------
# Utility Functions
# --------------------------------------------------

def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Convert a value to float without raising an exception.
    """

    if value is None:
        return default

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(
    value: Any,
    default: int = 0,
) -> int:
    """
    Convert a value to int without raising an exception.
    """

    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize_severity(
    severity: Optional[str],
) -> str:
    """
    Normalize severity values returned by existing engines.
    """

    normalized = str(
        severity or "low"
    ).strip().lower()

    if normalized not in SEVERITY_ORDER:
        return "low"

    return normalized


def _normalize_scenario(
    scenario: Optional[str],
) -> Optional[str]:
    """
    Normalize the optional Demo Mode scenario.

    Returns None when the service is operating
    in live mode.
    """

    normalized = str(
        scenario or ""
    ).strip()

    return normalized or None


def _calculate_variance_percent(
    actual: Any,
    plan: Any,
) -> float:
    """
    Calculate percentage variance against plan.
    """

    plan_value = _safe_float(plan)
    actual_value = _safe_float(actual)

    if plan_value == 0:
        return 0.0

    return round(
        (
            (actual_value - plan_value)
            / plan_value
        )
        * 100,
        1,
    )


def _calculate_performance_percent(
    actual: Any,
    plan: Any,
) -> float:
    """
    Calculate actual performance as a percentage of plan.
    """

    plan_value = _safe_float(plan)
    actual_value = _safe_float(actual)

    if plan_value == 0:
        return 0.0

    return round(
        (actual_value / plan_value) * 100,
        1,
    )


def _format_number(
    value: Any,
    decimals: int = 0,
) -> str:
    """
    Format numbers for executive-facing narrative.
    """

    number = _safe_float(value)

    if decimals == 0:
        return f"{number:,.0f}"

    return f"{number:,.{decimals}f}"


def _average(
    values: List[Any],
) -> float:
    """
    Return the arithmetic mean of valid numeric values.
    """

    numeric_values = [
        _safe_float(value)
        for value in values
        if value is not None
    ]

    if not numeric_values:
        return 0.0

    return round(
        sum(numeric_values) / len(numeric_values),
        1,
    )


def _build_reporting_period(
    trend_data: Dict[str, Any],
) -> str:
    """
    Build a readable reporting-period label.
    """

    start_date = trend_data.get("start_date")
    end_date = trend_data.get("end_date")

    if start_date and end_date:
        return f"{start_date} to {end_date}"

    return DEFAULT_REPORTING_PERIOD


def _build_demo_reporting_period(
    demo_data: Dict[str, Any],
) -> str:
    """
    Build the reporting period from generated demo records.
    """

    production = demo_data.get("production") or []

    if not production:
        return DEFAULT_REPORTING_PERIOD

    first_date = production[0].get("report_date")
    last_date = production[-1].get("report_date")

    if first_date and last_date:
        return f"{first_date} to {last_date}"

    return DEFAULT_REPORTING_PERIOD


def _build_mode(
    scenario: Optional[str],
) -> str:
    """
    Return the active service mode.
    """

    return "demo" if scenario else "live"


def _get_latest_records(
    records: List[Dict[str, Any]],
    count: int,
) -> List[Dict[str, Any]]:
    """
    Safely return the latest records.
    """

    if not isinstance(records, list):
        return []

    if count <= 0:
        return []

    return records[-count:]


# --------------------------------------------------
# Severity and Priority
# --------------------------------------------------

def _determine_severity(
    variance_percent: float,
    trend_direction: str,
    existing_severity: Optional[str] = None,
) -> str:
    """
    Determine executive insight severity.

    Critical:
        KPI is at least 10% below target.

    High:
        KPI is at least 5% below target, or
        KPI is below target while overall trend is declining.

    Medium:
        KPI is below target by less than 5%.

    Low:
        KPI is on or above target.
    """

    normalized_existing = _normalize_severity(
        existing_severity
    )

    normalized_direction = str(
        trend_direction or ""
    ).strip().lower()

    if variance_percent <= -10:
        return "critical"

    if variance_percent <= -5:
        return "high"

    if (
        variance_percent < 0
        and normalized_direction == "declining"
    ):
        return "high"

    if variance_percent < 0:
        return "medium"

    return normalized_existing


def _build_priority_label(
    severity: str,
) -> str:
    """
    Convert severity into an executive priority label.
    """

    labels = {
        "critical": "Immediate executive attention",
        "high": "High management priority",
        "medium": "Management review required",
        "low": "Continue routine monitoring",
    }

    return labels.get(
        severity,
        "Continue routine monitoring",
    )


# --------------------------------------------------
# Live Narrative Builders
# --------------------------------------------------

def _build_kpi_summary(
    kpi_name: str,
    plan: Any,
    actual: Any,
    performance: Any,
    variance_percent: float,
) -> str:
    """
    Build a concise executive KPI summary.
    """

    plan_value = _safe_float(plan)
    actual_value = _safe_float(actual)
    performance_value = _safe_float(performance)

    if plan_value <= 0:
        return (
            f"{kpi_name} performance is currently "
            "unavailable because no valid target was found."
        )

    if variance_percent < 0:
        return (
            f"{kpi_name} is "
            f"{abs(variance_percent):.1f}% below target. "
            f"Actual performance is "
            f"{_format_number(actual_value)} "
            f"against a plan of "
            f"{_format_number(plan_value)}, "
            f"or {performance_value:.1f}% of plan."
        )

    if variance_percent > 0:
        return (
            f"{kpi_name} is "
            f"{variance_percent:.1f}% above target. "
            f"Actual performance is "
            f"{_format_number(actual_value)} "
            f"against a plan of "
            f"{_format_number(plan_value)}, "
            f"or {performance_value:.1f}% of plan."
        )

    return (
        f"{kpi_name} is exactly on target at "
        f"{_format_number(actual_value)}."
    )


def _build_trend_summary(
    trend_data: Dict[str, Any],
) -> str:
    """
    Return the existing trend-engine summary.
    """

    summary = trend_data.get("summary")

    if summary:
        return str(summary)

    direction = trend_data.get(
        "direction",
        "No Data",
    )

    return (
        "The overall mine performance trend is "
        f"{str(direction).lower()}."
    )


def _find_likely_driver(
    kpi_name: str,
    trend_data: Dict[str, Any],
) -> str:
    """
    Select the most relevant existing trend driver.
    """

    drivers = trend_data.get("drivers") or []

    if not drivers:
        return (
            "No material operational driver "
            "was identified."
        )

    keyword_map = {
        "Ore Production": [
            "ore",
            "fleet",
            "plant",
        ],
        "Waste Movement": [
            "waste",
            "fleet",
        ],
    }

    keywords = keyword_map.get(
        kpi_name,
        [],
    )

    for driver in drivers:
        driver_text = str(driver)

        if any(
            keyword in driver_text.lower()
            for keyword in keywords
        ):
            return driver_text

    return str(drivers[0])


def _find_recommendation(
    kpi_name: str,
    trend_data: Dict[str, Any],
    severity: str,
) -> str:
    """
    Select the most relevant recommendation generated by
    the existing trend engine.
    """

    recommendations = (
        trend_data.get("recommendations") or []
    )

    keyword_map = {
        "Ore Production": [
            "mining sequence",
            "shovel",
            "ore",
            "fleet",
            "maintenance",
        ],
        "Waste Movement": [
            "waste",
            "truck",
            "haul road",
            "dump",
            "fleet",
        ],
    }

    keywords = keyword_map.get(
        kpi_name,
        [],
    )

    for recommendation in recommendations:
        recommendation_text = str(recommendation)

        if any(
            keyword in recommendation_text.lower()
            for keyword in keywords
        ):
            return recommendation_text

    if recommendations:
        return str(recommendations[0])

    if severity in {"critical", "high"}:
        return (
            f"Initiate an operational review of "
            f"{kpi_name.lower()} performance and "
            "assign a responsible owner."
        )

    if severity == "medium":
        return (
            "Review the main constraints affecting "
            f"{kpi_name.lower()} and monitor the "
            "next reporting period."
        )

    return (
        "Maintain the current operating rhythm and "
        "continue monitoring leading indicators."
    )


def _estimate_impact(
    kpi_name: str,
    plan: Any,
    actual: Any,
) -> Dict[str, Any]:
    """
    Estimate direct production impact from KPI variance.
    """

    plan_value = _safe_float(plan)
    actual_value = _safe_float(actual)

    shortfall = max(
        plan_value - actual_value,
        0.0,
    )

    if shortfall <= 0:
        return {
            "value": 0.0,
            "unit": "tonnes/day",
            "description": (
                f"No negative direct "
                f"{kpi_name.lower()} impact is "
                "currently estimated."
            ),
            "method": "Actual minus plan",
        }

    return {
        "value": round(shortfall, 1),
        "unit": "tonnes/day",
        "description": (
            "Estimated direct shortfall is "
            f"{_format_number(shortfall)} tonnes per day "
            "based on the difference between plan "
            "and actual."
        ),
        "method": "Plan minus actual",
    }


# --------------------------------------------------
# Live Insight Builder
# --------------------------------------------------

def _build_kpi_insight(
    insight_key: str,
    kpi_name: str,
    category: str,
    kpi_data: Dict[str, Any],
    trend_data: Dict[str, Any],
    report_date: Optional[str],
) -> Dict[str, Any]:
    """
    Convert KPI and trend output into one structured
    executive insight.
    """

    plan = kpi_data.get("plan")
    actual = kpi_data.get("actual")
    performance = kpi_data.get("performance")
    existing_severity = kpi_data.get("severity")
    status = kpi_data.get("status")

    variance_percent = _calculate_variance_percent(
        actual=actual,
        plan=plan,
    )

    trend_direction = trend_data.get(
        "direction",
        "No Data",
    )

    severity = _determine_severity(
        variance_percent=variance_percent,
        trend_direction=trend_direction,
        existing_severity=existing_severity,
    )

    likely_driver = _find_likely_driver(
        kpi_name=kpi_name,
        trend_data=trend_data,
    )

    recommendation = _find_recommendation(
        kpi_name=kpi_name,
        trend_data=trend_data,
        severity=severity,
    )

    impact = _estimate_impact(
        kpi_name=kpi_name,
        plan=plan,
        actual=actual,
    )

    return {
        "insight_key": insight_key,
        "category": category,
        "kpi_name": kpi_name,
        "severity": severity,
        "priority": _build_priority_label(
            severity
        ),
        "title": (
            f"{kpi_name} Below Target"
            if variance_percent < 0
            else f"{kpi_name} Performance"
        ),
        "summary": _build_kpi_summary(
            kpi_name=kpi_name,
            plan=plan,
            actual=actual,
            performance=performance,
            variance_percent=variance_percent,
        ),
        "trend": {
            "direction": trend_direction,
            "change_percent": _safe_float(
                trend_data.get("change_percent")
            ),
            "summary": _build_trend_summary(
                trend_data
            ),
        },
        "likely_driver": likely_driver,
        "estimated_impact": impact,
        "recommended_priority": recommendation,
        "confidence": 0.75,
        "confidence_label": "Rule-based estimate",
        "current_value": _safe_float(actual),
        "target_value": _safe_float(plan),
        "performance_percent": _safe_float(
            performance
        ),
        "variance_percent": variance_percent,
        "status": status,
        "report_date": report_date,
        "source": {
            "type": "rule_based_orchestrator",
            "engines": [
                "KPI Intelligence Engine",
                "Trend Analysis Engine",
            ],
        },
    }


# --------------------------------------------------
# Fleet Breakdown Demo Insight Builders
# --------------------------------------------------

def _build_demo_impact(
    value: float,
    unit: str,
    description: str,
    method: str,
) -> Dict[str, Any]:
    """
    Build a consistent impact object.
    """

    return {
        "value": round(
            _safe_float(value),
            1,
        ),
        "unit": unit,
        "description": description,
        "method": method,
    }


def _build_fleet_breakdown_insights(
    mine_name: str,
) -> Dict[str, Any]:
    """
    Generate structured executive insights for the
    deterministic Fleet Breakdown scenario.
    """

    demo_data = generate_all_demo_data(
        scenario="Fleet Breakdown",
        mine_name=mine_name,
    )

    production_records = (
        demo_data.get("production") or []
    )
    fleet_records = (
        demo_data.get("fleet") or []
    )
    maintenance_records = (
        demo_data.get("maintenance") or []
    )
    plant_records = (
        demo_data.get("plant") or []
    )

    if (
        not production_records
        or not fleet_records
        or not maintenance_records
    ):
        return {
            "demo_data": demo_data,
            "insights": [],
            "report_date": None,
            "reporting_period": (
                _build_demo_reporting_period(
                    demo_data
                )
            ),
        }

    latest_production = production_records[-1]
    latest_maintenance = maintenance_records[-1]
    latest_plant = (
        plant_records[-1]
        if plant_records
        else {}
    )

    latest_fleet = _get_latest_records(
        fleet_records,
        5,
    )

    previous_fleet = (
        fleet_records[-10:-5]
        if len(fleet_records) >= 10
        else []
    )

    ore_plan = _safe_float(
        latest_production.get("ore_plan")
    )
    ore_actual = _safe_float(
        latest_production.get("ore_actual")
    )

    waste_plan = _safe_float(
        latest_production.get("waste_plan")
    )
    waste_actual = _safe_float(
        latest_production.get("waste_actual")
    )

    ore_performance = (
        _calculate_performance_percent(
            ore_actual,
            ore_plan,
        )
    )

    waste_performance = (
        _calculate_performance_percent(
            waste_actual,
            waste_plan,
        )
    )

    ore_variance = _calculate_variance_percent(
        ore_actual,
        ore_plan,
    )

    waste_variance = _calculate_variance_percent(
        waste_actual,
        waste_plan,
    )

    fleet_availability = _average([
        item.get("availability")
        for item in latest_fleet
    ])

    fleet_utilization = _average([
        item.get("utilization")
        for item in latest_fleet
    ])

    previous_utilization = _average([
        item.get("utilization")
        for item in previous_fleet
    ])

    fleet_utilization_change = round(
        fleet_utilization - previous_utilization,
        1,
    )

    average_breakdown_hours = _average([
        item.get("breakdown_hours")
        for item in latest_fleet
    ])

    average_idle_hours = _average([
        item.get("idle_hours")
        for item in latest_fleet
    ])

    backlog_work_orders = _safe_int(
        latest_maintenance.get(
            "backlog_work_orders"
        )
    )

    pm_compliance = _safe_float(
        latest_maintenance.get(
            "pm_compliance"
        )
    )

    unplanned_work_percent = _safe_float(
        latest_maintenance.get(
            "unplanned_work_percent"
        )
    )

    equipment_availability = _safe_float(
        latest_maintenance.get(
            "equipment_availability"
        )
    )

    throughput_plan = _safe_float(
        latest_plant.get(
            "throughput_plan"
        )
    )

    throughput_actual = _safe_float(
        latest_plant.get(
            "throughput_actual"
        )
    )

    plant_performance = (
        _calculate_performance_percent(
            throughput_actual,
            throughput_plan,
        )
        if throughput_plan
        else 0.0
    )

    ore_shortfall = max(
        ore_plan - ore_actual,
        0.0,
    )

    waste_shortfall = max(
        waste_plan - waste_actual,
        0.0,
    )

    fleet_target = 90.0

    fleet_variance = round(
        fleet_utilization - fleet_target,
        1,
    )

    insights: List[Dict[str, Any]] = []

    insights.append({
        "insight_key": (
            "fleet-breakdown-performance"
        ),
        "category": "Fleet",
        "kpi_name": "Fleet Performance",
        "severity": "high",
        "priority": (
            "High management priority"
        ),
        "title": (
            "Fleet Performance Below Target"
        ),
        "summary": (
            f"Fleet utilization is "
            f"{fleet_utilization:.1f}% against a "
            f"{fleet_target:.1f}% target. "
            f"Availability has declined to "
            f"{fleet_availability:.1f}%, while average "
            f"breakdown duration has increased to "
            f"{average_breakdown_hours:.1f} hours per truck."
        ),
        "trend": {
            "direction": "Declining",
            "change_percent": (
                fleet_utilization_change
            ),
            "summary": (
                f"Fleet utilization declined by "
                f"{abs(fleet_utilization_change):.1f} "
                "percentage points compared with the "
                "previous reporting day."
            ),
        },
        "likely_driver": (
            "Mobile-equipment availability and "
            "unplanned truck downtime are reducing "
            "haulage capacity."
        ),
        "estimated_impact": _build_demo_impact(
            value=ore_shortfall,
            unit="tonnes/day",
            description=(
                f"Reduced haulage capacity is associated "
                f"with an estimated ore shortfall of "
                f"{_format_number(ore_shortfall)} tonnes "
                "per day."
            ),
            method=(
                "Production plan minus actual, "
                "linked to fleet constraint"
            ),
        ),
        "recommended_priority": (
            "Launch an immediate fleet recovery plan, "
            "prioritize repairs on the highest-downtime "
            "trucks, rebalance available equipment, and "
            "review the maintenance backlog with the "
            "Mine and Maintenance Managers."
        ),
        "confidence": 0.92,
        "confidence_label": (
            "Deterministic demo confidence"
        ),
        "current_value": fleet_utilization,
        "target_value": fleet_target,
        "performance_percent": (
            fleet_utilization
        ),
        "variance_percent": fleet_variance,
        "status": "Below Plan",
        "report_date": (
            latest_production.get(
                "report_date"
            )
        ),
        "supporting_metrics": {
            "fleet_availability": (
                fleet_availability
            ),
            "average_breakdown_hours": (
                average_breakdown_hours
            ),
            "average_idle_hours": (
                average_idle_hours
            ),
            "maintenance_backlog": (
                backlog_work_orders
            ),
            "equipment_availability": (
                equipment_availability
            ),
        },
        "source": {
            "type": (
                "deterministic_demo_orchestrator"
            ),
            "engines": [
                "Demo Scenario Engine",
                "Fleet KPI Analysis",
                "Maintenance Risk Analysis",
            ],
        },
    })

    insights.append({
        "insight_key": (
            "waste-movement-fleet-constraint"
        ),
        "category": "Production",
        "kpi_name": "Waste Movement",
        "severity": "critical",
        "priority": (
            "Immediate executive attention"
        ),
        "title": (
            "Waste Movement Critically Below Target"
        ),
        "summary": (
            f"Waste movement is "
            f"{abs(waste_variance):.1f}% below target. "
            f"Actual movement is "
            f"{_format_number(waste_actual)} tonnes "
            f"against a plan of "
            f"{_format_number(waste_plan)} tonnes."
        ),
        "trend": {
            "direction": "Declining",
            "change_percent": -10.0,
            "summary": (
                "Waste movement has deteriorated as "
                "available trucks have been redirected "
                "and haulage capacity has fallen."
            ),
        },
        "likely_driver": (
            "The fleet breakdown is constraining truck "
            "allocation to waste routes and reducing "
            "effective haulage hours."
        ),
        "estimated_impact": _build_demo_impact(
            value=waste_shortfall,
            unit="tonnes/day",
            description=(
                f"Estimated waste movement shortfall is "
                f"{_format_number(waste_shortfall)} "
                "tonnes per day."
            ),
            method=(
                "Waste plan minus actual"
            ),
        ),
        "recommended_priority": (
            "Protect critical waste movements, review "
            "truck allocation between ore and waste, "
            "remove haul-route delays, and confirm dump "
            "and dozer capacity for the next shift."
        ),
        "confidence": 0.90,
        "confidence_label": (
            "Deterministic demo confidence"
        ),
        "current_value": waste_actual,
        "target_value": waste_plan,
        "performance_percent": (
            waste_performance
        ),
        "variance_percent": waste_variance,
        "status": "Below Plan",
        "report_date": (
            latest_production.get(
                "report_date"
            )
        ),
        "source": {
            "type": (
                "deterministic_demo_orchestrator"
            ),
            "engines": [
                "Demo Scenario Engine",
                "Production KPI Analysis",
                "Fleet Constraint Analysis",
            ],
        },
    })

    insights.append({
        "insight_key": (
            "ore-production-fleet-constraint"
        ),
        "category": "Production",
        "kpi_name": "Ore Production",
        "severity": "high",
        "priority": (
            "High management priority"
        ),
        "title": (
            "Ore Production Below Target"
        ),
        "summary": (
            f"Ore production is "
            f"{abs(ore_variance):.1f}% below target. "
            f"Actual production is "
            f"{_format_number(ore_actual)} tonnes "
            f"against a plan of "
            f"{_format_number(ore_plan)} tonnes."
        ),
        "trend": {
            "direction": "Declining",
            "change_percent": -6.0,
            "summary": (
                "Ore delivery has declined as truck "
                "availability and effective haulage "
                "capacity have weakened."
            ),
        },
        "likely_driver": (
            "Reduced fleet availability is limiting "
            "ore haulage and loading-unit productivity."
        ),
        "estimated_impact": _build_demo_impact(
            value=ore_shortfall,
            unit="tonnes/day",
            description=(
                f"Estimated ore production shortfall is "
                f"{_format_number(ore_shortfall)} "
                "tonnes per day."
            ),
            method="Ore plan minus actual",
        ),
        "recommended_priority": (
            "Protect high-value ore movements, assign "
            "available trucks to the most critical ore "
            "routes, and review loading-unit and dispatch "
            "constraints during the next operating review."
        ),
        "confidence": 0.89,
        "confidence_label": (
            "Deterministic demo confidence"
        ),
        "current_value": ore_actual,
        "target_value": ore_plan,
        "performance_percent": (
            ore_performance
        ),
        "variance_percent": ore_variance,
        "status": "Below Plan",
        "report_date": (
            latest_production.get(
                "report_date"
            )
        ),
        "source": {
            "type": (
                "deterministic_demo_orchestrator"
            ),
            "engines": [
                "Demo Scenario Engine",
                "Production KPI Analysis",
                "Fleet Constraint Analysis",
            ],
        },
    })

    insights.append({
        "insight_key": (
            "maintenance-recovery-risk"
        ),
        "category": "Maintenance",
        "kpi_name": "Maintenance Recovery",
        "severity": "high",
        "priority": (
            "High management priority"
        ),
        "title": (
            "Maintenance Recovery Risk"
        ),
        "summary": (
            f"Maintenance backlog has increased to "
            f"{backlog_work_orders} work orders. "
            f"PM compliance is {pm_compliance:.1f}% and "
            f"unplanned work represents "
            f"{unplanned_work_percent:.1f}% of total work."
        ),
        "trend": {
            "direction": "Declining",
            "change_percent": -16.0,
            "summary": (
                "Maintenance performance is weakening "
                "as unplanned work and equipment failures "
                "increase."
            ),
        },
        "likely_driver": (
            "High unplanned maintenance demand is "
            "displacing preventive work and delaying "
            "equipment return-to-service."
        ),
        "estimated_impact": _build_demo_impact(
            value=backlog_work_orders,
            unit="work orders",
            description=(
                f"The current backlog of "
                f"{backlog_work_orders} work orders "
                "raises the risk of continued equipment "
                "availability loss."
            ),
            method=(
                "Latest deterministic maintenance "
                "scenario record"
            ),
        ),
        "recommended_priority": (
            "Prioritize critical equipment work orders, "
            "assign recovery owners, protect the next "
            "maintenance window, and separate urgent "
            "breakdown work from recoverable backlog."
        ),
        "confidence": 0.91,
        "confidence_label": (
            "Deterministic demo confidence"
        ),
        "current_value": (
            equipment_availability
        ),
        "target_value": 90.0,
        "performance_percent": (
            equipment_availability
        ),
        "variance_percent": round(
            equipment_availability - 90.0,
            1,
        ),
        "status": "Below Plan",
        "report_date": (
            latest_maintenance.get(
                "report_date"
            )
        ),
        "supporting_metrics": {
            "pm_compliance": pm_compliance,
            "maintenance_backlog": (
                backlog_work_orders
            ),
            "unplanned_work_percent": (
                unplanned_work_percent
            ),
            "equipment_availability": (
                equipment_availability
            ),
            "plant_performance": (
                plant_performance
            ),
        },
        "source": {
            "type": (
                "deterministic_demo_orchestrator"
            ),
            "engines": [
                "Demo Scenario Engine",
                "Maintenance Risk Analysis",
                "Fleet Recovery Analysis",
            ],
        },
    })

    return {
        "demo_data": demo_data,
        "insights": insights,
        "report_date": (
            latest_production.get(
                "report_date"
            )
        ),
        "reporting_period": (
            _build_demo_reporting_period(
                demo_data
            )
        ),
        "overall_trend": {
            "direction": "Declining",
            "change_percent": -14.9,
            "summary": (
                "Mine performance is declining under the "
                "Fleet Breakdown scenario. Fleet "
                "availability, production delivery, and "
                "maintenance recovery all require "
                "coordinated management action."
            ),
        },
    }


# --------------------------------------------------
# Response Helpers
# --------------------------------------------------

def _count_severities(
    insights: List[Dict[str, Any]],
) -> Dict[str, int]:
    """
    Count insights by severity.
    """

    counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    for insight in insights:
        severity = _normalize_severity(
            insight.get("severity")
        )

        counts[severity] += 1

    return counts


def _sort_insights(
    insights: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Sort critical and high-priority insights first.
    """

    return sorted(
        insights,
        key=lambda item: SEVERITY_ORDER.get(
            _normalize_severity(
                item.get("severity")
            ),
            0,
        ),
        reverse=True,
    )


def _build_executive_headline(
    insights: List[Dict[str, Any]],
    trend_data: Dict[str, Any],
) -> str:
    """
    Build one high-level executive headline.
    """

    if not insights:
        return (
            "No executive insights are available because "
            "no valid KPI data was found."
        )

    highest = insights[0]

    severity = highest.get(
        "severity",
        "low",
    )

    title = highest.get(
        "title",
        "Operational Performance",
    )

    if severity == "critical":
        return (
            "Immediate executive attention is required: "
            f"{title}."
        )

    if severity == "high":
        return (
            "High-priority operational review required: "
            f"{title}."
        )

    direction = str(
        trend_data.get(
            "direction",
            "stable",
        )
    ).lower()

    return (
        f"Overall mine performance is {direction}; "
        "the leading insight is "
        f"{title.lower()}."
    )


def _build_base_response(
    mine_name: str,
    scenario: Optional[str],
    generated_at: str,
) -> Dict[str, Any]:
    """
    Return fields shared by all response types.
    """

    return {
        "engine": (
            "Executive Insight Orchestrator V2"
        ),
        "version": "1.0",
        "mine_name": mine_name,
        "scenario": scenario,
        "mode": _build_mode(
            scenario
        ),
        "generated_at": generated_at,
    }


# --------------------------------------------------
# Demo Response Generator
# --------------------------------------------------

def _get_demo_executive_summary(
    mine_name: str,
    scenario: str,
    generated_at: str,
) -> Dict[str, Any]:
    """
    Generate a scenario-specific executive summary.
    """

    base_response = _build_base_response(
        mine_name=mine_name,
        scenario=scenario,
        generated_at=generated_at,
    )

    if scenario == "Fleet Breakdown":
        result = (
            _build_fleet_breakdown_insights(
                mine_name=mine_name
            )
        )

        insights = _sort_insights(
            result.get("insights") or []
        )

        severity_counts = (
            _count_severities(
                insights
            )
        )

        trend_data = (
            result.get("overall_trend")
            or {}
        )

        return {
            **base_response,
            "status": "success",
            "report_date": (
                result.get("report_date")
            ),
            "reporting_period": (
                result.get(
                    "reporting_period",
                    DEFAULT_REPORTING_PERIOD,
                )
            ),
            "executive_headline": (
                _build_executive_headline(
                    insights=insights,
                    trend_data=trend_data,
                )
            ),
            "overall_trend": trend_data,
            "total_insights": len(
                insights
            ),
            "severity_counts": (
                severity_counts
            ),
            "insights": insights,
        }

    return {
        **base_response,
        "status": "unsupported_demo_scenario",
        "message": (
            f"Scenario-specific executive insights "
            f"are not yet implemented for "
            f"{scenario}."
        ),
        "report_date": None,
        "reporting_period": (
            DEFAULT_REPORTING_PERIOD
        ),
        "executive_headline": (
            "The selected demo scenario does not yet "
            "have a dedicated executive insight model."
        ),
        "overall_trend": {
            "direction": "No Data",
            "change_percent": 0.0,
            "summary": (
                "No scenario-specific trend is "
                "currently available."
            ),
        },
        "total_insights": 0,
        "severity_counts": {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
        },
        "insights": [],
    }


# --------------------------------------------------
# Main Executive Insight Orchestrator
# --------------------------------------------------

def get_executive_summary_v2(
    mine_name: str,
    db: Session,
    scenario: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate structured executive insights.

    Live mode:
        Uses PostgreSQL KPI and trend data.

    Demo mode:
        Uses deterministic scenario datasets when the
        supplied scenario has a dedicated implementation.
    """

    generated_at = datetime.now(
        timezone.utc
    ).isoformat()

    normalized_scenario = (
        _normalize_scenario(
            scenario
        )
    )

    if normalized_scenario:
        try:
            return _get_demo_executive_summary(
                mine_name=mine_name,
                scenario=normalized_scenario,
                generated_at=generated_at,
            )
        except Exception as exc:
            base_response = (
                _build_base_response(
                    mine_name=mine_name,
                    scenario=normalized_scenario,
                    generated_at=generated_at,
                )
            )

            return {
                **base_response,
                "status": "error",
                "message": (
                    "Demo executive insight "
                    "generation failed."
                ),
                "error": str(exc),
                "total_insights": 0,
                "severity_counts": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                },
                "insights": [],
            }

    base_response = _build_base_response(
        mine_name=mine_name,
        scenario=None,
        generated_at=generated_at,
    )

    try:
        kpi_data = get_kpi_intelligence()

        trend_data = (
            get_trend_analysis_service(
                mine_name=mine_name,
                db=db,
            )
        )

        if not kpi_data:
            return {
                **base_response,
                "status": "no_data",
                "message": (
                    "No KPI intelligence data "
                    "was returned."
                ),
                "total_insights": 0,
                "severity_counts": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                },
                "insights": [],
            }

        if (
            kpi_data.get("message")
            == "No production data found"
        ):
            return {
                **base_response,
                "status": "no_data",
                "message": (
                    "No production data is available "
                    "for executive insight generation."
                ),
                "report_date": None,
                "reporting_period": (
                    _build_reporting_period(
                        trend_data
                    )
                ),
                "total_insights": 0,
                "severity_counts": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                },
                "insights": [],
            }

        report_date = (
            kpi_data.get("report_date")
        )

        insights: List[
            Dict[str, Any]
        ] = []

        ore_data = kpi_data.get("ore")

        if isinstance(ore_data, dict):
            insights.append(
                _build_kpi_insight(
                    insight_key=(
                        "ore-production-performance"
                    ),
                    kpi_name=(
                        "Ore Production"
                    ),
                    category="Production",
                    kpi_data=ore_data,
                    trend_data=trend_data,
                    report_date=report_date,
                )
            )

        waste_data = (
            kpi_data.get("waste")
        )

        if isinstance(
            waste_data,
            dict,
        ):
            insights.append(
                _build_kpi_insight(
                    insight_key=(
                        "waste-movement-performance"
                    ),
                    kpi_name=(
                        "Waste Movement"
                    ),
                    category="Production",
                    kpi_data=waste_data,
                    trend_data=trend_data,
                    report_date=report_date,
                )
            )

        insights = _sort_insights(
            insights
        )

        severity_counts = (
            _count_severities(
                insights
            )
        )

        return {
            **base_response,
            "status": "success",
            "report_date": report_date,
            "reporting_period": (
                _build_reporting_period(
                    trend_data
                )
            ),
            "executive_headline": (
                _build_executive_headline(
                    insights=insights,
                    trend_data=trend_data,
                )
            ),
            "overall_trend": {
                "direction": (
                    trend_data.get(
                        "direction",
                        "No Data",
                    )
                ),
                "change_percent": (
                    _safe_float(
                        trend_data.get(
                            "change_percent"
                        )
                    )
                ),
                "summary": (
                    trend_data.get(
                        "summary",
                        (
                            "No trend summary is "
                            "currently available."
                        ),
                    )
                ),
            },
            "total_insights": len(
                insights
            ),
            "severity_counts": (
                severity_counts
            ),
            "insights": insights,
        }

    except Exception as exc:
        return {
            **base_response,
            "status": "error",
            "message": (
                "Executive insight generation failed."
            ),
            "error": str(exc),
            "total_insights": 0,
            "severity_counts": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
            },
            "insights": [],
        }