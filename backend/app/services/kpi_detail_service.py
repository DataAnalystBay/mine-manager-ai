from typing import Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.kpi_calculation_service import (
    calculate_fleet_score,
    calculate_health_score,
    calculate_plant_score,
    safe_percentage,
)


KPI_CONFIG: Dict[str, Dict] = {
    "mine_health": {
        "title": "Mine Health",
        "target": 90.0,
        "unit": "/100",
        "drivers": [
            "Fleet utilization and availability",
            "Production plan attainment",
            "Plant performance",
            "Safety performance",
        ],
        "recommendations": [
            "Review the lowest-performing operational KPI",
            "Maintain cross-functional short-interval control",
            "Continue monitoring leading operational indicators",
        ],
    },

    "ore": {
        "title": "Ore Performance",
        "target": 100.0,
        "unit": "%",
        "drivers": [
            "Ore production plan attainment",
            "Fleet haulage capacity",
            "Mining sequence execution",
        ],
        "recommendations": [
            "Review the next 24-hour mining sequence",
            "Prioritize ore haulage equipment",
            "Confirm crusher feed continuity",
        ],
    },

    "waste": {
        "title": "Waste Movement",
        "target": 100.0,
        "unit": "%",
        "drivers": [
            "Waste movement plan attainment",
            "Truck allocation",
            "Haul road and dump constraints",
        ],
        "recommendations": [
            "Prioritize critical waste routes",
            "Review truck allocation by destination",
            "Monitor haul road constraints",
        ],
    },

    "fleet": {
        "title": "Fleet Performance",
        "target": 90.0,
        "unit": "%",
        "drivers": [
            "Fleet availability",
            "Fleet utilization",
            "Maintenance and dispatch performance",
        ],
        "recommendations": [
            "Protect fleet availability above target",
            "Monitor utilization and idle time",
            "Review maintenance and dispatch constraints",
        ],
    },

    "plant": {
        "title": "Plant Performance",
        "target": 95.0,
        "unit": "%",
        "drivers": [
            "Throughput performance",
            "Plant recovery",
            "Plant availability and downtime",
        ],
        "recommendations": [
            "Maintain current plant operating rhythm",
            "Monitor throughput constraint risk",
            "Protect planned maintenance windows",
        ],
    },

    "safety": {
        "title": "Safety Incidents",
        "target": 0.0,
        "unit": "",
        "drivers": [
            "Recordable incidents",
            "Near misses",
            "Critical risk exposure",
        ],
        "recommendations": [
            "Maintain critical control verification",
            "Continue visible leadership interactions",
            "Monitor fatigue and operational exposure",
        ],
    },
}


def _safe_float(
    value,
    default: float = 0.0,
) -> float:
    try:
        if value is None:
            return default

        return float(value)
    except (TypeError, ValueError):
        return default


def _calculate_change(
    values: List[float],
) -> Dict:
    if not values:
        return {
            "change": 0.0,
            "change_percent": 0.0,
            "direction": "flat",
        }

    first_value = _safe_float(
        values[0]
    )

    last_value = _safe_float(
        values[-1]
    )

    change = round(
        last_value - first_value,
        2,
    )

    change_percent = (
        round(
            (
                change /
                abs(first_value)
            ) * 100,
            2,
        )
        if first_value != 0
        else 0.0
    )

    if change > 0:
        direction = "up"

    elif change < 0:
        direction = "down"

    else:
        direction = "flat"

    return {
        "change": change,
        "change_percent":
            change_percent,
        "direction": direction,
    }


def _build_period_label(
    count: int,
) -> str:
    return (
        f"Last {count} "
        f"{'Day' if count == 1 else 'Days'}"
    )


def _production_history(
    db: Session,
    mine_name: str,
    days: int,
    metric: str,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                ore_actual,
                ore_plan,
                waste_actual,
                waste_plan
            FROM public.production_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    rows = list(
        reversed(rows)
    )

    values = []

    for row in rows:
        if metric == "ore":
            value = safe_percentage(
                row["ore_actual"],
                row["ore_plan"],
            )
        else:
            value = safe_percentage(
                row["waste_actual"],
                row["waste_plan"],
            )

        values.append(
            {
                "date": str(
                    row["report_date"]
                ),
                "value": value,
            }
        )

    return values


def _fleet_history(
    db: Session,
    mine_name: str,
    days: int,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                availability,
                utilization
            FROM public.fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    rows = list(
        reversed(rows)
    )

    return [
        {
            "date": str(
                row["report_date"]
            ),
            "value":
                calculate_fleet_score(
                    row["availability"],
                    row["utilization"],
                ),
        }
        for row in rows
    ]


def _plant_history(
    db: Session,
    mine_name: str,
    days: int,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_actual,
                throughput_plan,
                recovery
            FROM public.plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    rows = list(
        reversed(rows)
    )

    values = []

    for row in rows:
        plant_score, _, _ = (
            calculate_plant_score(
                row[
                    "throughput_actual"
                ],
                row[
                    "throughput_plan"
                ],
                row[
                    "recovery"
                ],
            )
        )

        values.append(
            {
                "date": str(
                    row["report_date"]
                ),
                "value": plant_score,
            }
        )

    return values


def _safety_history(
    db: Session,
    mine_name: str,
    days: int,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                incidents
            FROM public.safety_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    rows = list(
        reversed(rows)
    )

    return [
        {
            "date": str(
                row["report_date"]
            ),
            "value":
                _safe_float(
                    row["incidents"]
                ),
        }
        for row in rows
    ]


def _mine_health_history(
    db: Session,
    mine_name: str,
    days: int,
) -> List[Dict]:
    production_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                ore_actual,
                ore_plan,
                waste_actual,
                waste_plan
            FROM public.production_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    fleet_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                availability,
                utilization
            FROM public.fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    plant_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_actual,
                throughput_plan,
                recovery
            FROM public.plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    safety_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                safety_score
            FROM public.safety_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": mine_name,
            "days": days,
        },
    ).mappings().all()

    production_by_date = {
        row["report_date"]: row
        for row in production_rows
    }

    fleet_by_date = {
        row["report_date"]: row
        for row in fleet_rows
    }

    plant_by_date = {
        row["report_date"]: row
        for row in plant_rows
    }

    safety_by_date = {
        row["report_date"]: row
        for row in safety_rows
    }

    dates = sorted(
        production_by_date.keys()
    )

    values = []

    for report_date in dates:
        production = (
            production_by_date.get(
                report_date
            )
        )

        if not production:
            continue

        ore = safe_percentage(
            production[
                "ore_actual"
            ],
            production[
                "ore_plan"
            ],
        )

        waste = safe_percentage(
            production[
                "waste_actual"
            ],
            production[
                "waste_plan"
            ],
        )

        fleet_row = (
            fleet_by_date.get(
                report_date
            )
        )

        fleet = (
            calculate_fleet_score(
                fleet_row[
                    "availability"
                ],
                fleet_row[
                    "utilization"
                ],
            )
            if fleet_row
            else 0.0
        )

        plant_row = (
            plant_by_date.get(
                report_date
            )
        )

        if plant_row:
            plant, _, _ = (
                calculate_plant_score(
                    plant_row[
                        "throughput_actual"
                    ],
                    plant_row[
                        "throughput_plan"
                    ],
                    plant_row[
                        "recovery"
                    ],
                )
            )
        else:
            plant = 0.0

        safety_row = (
            safety_by_date.get(
                report_date
            )
        )

        safety_score = (
            _safe_float(
                safety_row[
                    "safety_score"
                ]
            )
            if safety_row
            else 0.0
        )

        health = (
            calculate_health_score(
                ore=ore,
                waste=waste,
                fleet=fleet,
                plant=plant,
                safety_score=safety_score,
            )
        )

        values.append(
            {
                "date": str(
                    report_date
                ),
                "value": health,
            }
        )

    return values[-days:]



def _driver_direction(
    change: float,
) -> str:
    if change > 0:
        return "up"

    if change < 0:
        return "down"

    return "flat"


def _driver_impact(
    change: float,
) -> str:
    magnitude = abs(
        _safe_float(change)
    )

    if magnitude >= 3:
        return "high"

    if magnitude >= 1:
        return "medium"

    return "low"


def _percent_change(
    current,
    previous,
) -> float:
    current_value = _safe_float(
        current
    )

    previous_value = _safe_float(
        previous
    )

    if previous_value == 0:
        return 0.0

    return round(
        (
            (
                current_value -
                previous_value
            ) /
            abs(previous_value)
        ) * 100,
        2,
    )


def _absolute_change(
    current,
    previous,
) -> float:
    return round(
        _safe_float(current) -
        _safe_float(previous),
        2,
    )


def _build_driver(
    name: str,
    value,
    unit: str,
    change,
    description: str,
) -> Dict:
    numeric_change = _safe_float(
        change
    )

    return {
        "name": name,
        "value": round(
            _safe_float(value),
            2,
        ),
        "unit": unit,
        "change": round(
            numeric_change,
            2,
        ),
        "direction":
            _driver_direction(
                numeric_change
            ),
        "impact":
            _driver_impact(
                numeric_change
            ),
        "description":
            description,
    }


def _build_production_drivers(
    db: Session,
    mine_name: str,
    metric: str,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                ore_actual,
                ore_plan,
                waste_actual,
                waste_plan
            FROM public.production_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    if not rows:
        return []

    latest = rows[0]
    previous = (
        rows[1]
        if len(rows) > 1
        else rows[0]
    )

    if metric == "ore":
        actual_key = "ore_actual"
        plan_key = "ore_plan"
        label = "Ore"
    else:
        actual_key = "waste_actual"
        plan_key = "waste_plan"
        label = "Waste"

    latest_performance = (
        safe_percentage(
            latest[actual_key],
            latest[plan_key],
        )
    )

    previous_performance = (
        safe_percentage(
            previous[actual_key],
            previous[plan_key],
        )
    )

    performance_change = (
        _absolute_change(
            latest_performance,
            previous_performance,
        )
    )

    actual_change = (
        _percent_change(
            latest[actual_key],
            previous[actual_key],
        )
    )

    plan_change = (
        _percent_change(
            latest[plan_key],
            previous[plan_key],
        )
    )

    return [
        _build_driver(
            name=f"{label} Plan Attainment",
            value=latest_performance,
            unit="%",
            change=performance_change,
            description=(
                f"Latest {label.lower()} "
                "actual-versus-plan performance "
                "from PostgreSQL."
            ),
        ),
        _build_driver(
            name=f"{label} Actual",
            value=latest[actual_key],
            unit="t",
            change=actual_change,
            description=(
                f"Latest {label.lower()} actual "
                "movement from production data."
            ),
        ),
        _build_driver(
            name=f"{label} Plan",
            value=latest[plan_key],
            unit="t",
            change=plan_change,
            description=(
                f"Current {label.lower()} "
                "production plan."
            ),
        ),
    ]


def _build_fleet_drivers(
    db: Session,
    mine_name: str,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                availability,
                utilization
            FROM public.fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    if not rows:
        return []

    latest = rows[0]
    previous = (
        rows[1]
        if len(rows) > 1
        else rows[0]
    )

    latest_availability = (
        _safe_float(
            latest["availability"]
        )
    )

    previous_availability = (
        _safe_float(
            previous["availability"]
        )
    )

    latest_utilization = (
        _safe_float(
            latest["utilization"]
        )
    )

    previous_utilization = (
        _safe_float(
            previous["utilization"]
        )
    )

    latest_score = (
        calculate_fleet_score(
            latest_availability,
            latest_utilization,
        )
    )

    previous_score = (
        calculate_fleet_score(
            previous_availability,
            previous_utilization,
        )
    )

    return [
        _build_driver(
            name="Fleet Availability",
            value=latest_availability,
            unit="%",
            change=_absolute_change(
                latest_availability,
                previous_availability,
            ),
            description=(
                "Latest fleet availability "
                "from PostgreSQL."
            ),
        ),
        _build_driver(
            name="Fleet Utilization",
            value=latest_utilization,
            unit="%",
            change=_absolute_change(
                latest_utilization,
                previous_utilization,
            ),
            description=(
                "Latest fleet utilization "
                "from PostgreSQL."
            ),
        ),
        _build_driver(
            name="Fleet Performance",
            value=latest_score,
            unit="%",
            change=_absolute_change(
                latest_score,
                previous_score,
            ),
            description=(
                "Combined fleet availability "
                "and utilization score."
            ),
        ),
    ]


def _build_plant_drivers(
    db: Session,
    mine_name: str,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_actual,
                throughput_plan,
                recovery
            FROM public.plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    if not rows:
        return []

    latest = rows[0]
    previous = (
        rows[1]
        if len(rows) > 1
        else rows[0]
    )

    latest_score, latest_throughput, latest_recovery = (
        calculate_plant_score(
            latest["throughput_actual"],
            latest["throughput_plan"],
            latest["recovery"],
        )
    )

    previous_score, previous_throughput, previous_recovery = (
        calculate_plant_score(
            previous["throughput_actual"],
            previous["throughput_plan"],
            previous["recovery"],
        )
    )

    return [
        _build_driver(
            name="Throughput Performance",
            value=latest_throughput,
            unit="%",
            change=_absolute_change(
                latest_throughput,
                previous_throughput,
            ),
            description=(
                "Latest plant throughput "
                "actual-versus-plan performance."
            ),
        ),
        _build_driver(
            name="Plant Recovery",
            value=latest_recovery,
            unit="%",
            change=_absolute_change(
                latest_recovery,
                previous_recovery,
            ),
            description=(
                "Latest metallurgical recovery "
                "reported by the plant."
            ),
        ),
        _build_driver(
            name="Plant Performance",
            value=latest_score,
            unit="%",
            change=_absolute_change(
                latest_score,
                previous_score,
            ),
            description=(
                "Combined plant throughput "
                "and recovery performance score."
            ),
        ),
    ]


def _build_safety_drivers(
    db: Session,
    mine_name: str,
) -> List[Dict]:
    rows = db.execute(
        text(
            """
            SELECT
                report_date,
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM public.safety_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    if not rows:
        return []

    latest = rows[0]
    previous = (
        rows[1]
        if len(rows) > 1
        else rows[0]
    )

    return [
        _build_driver(
            name="Recordable Incidents",
            value=latest["incidents"],
            unit="",
            change=_absolute_change(
                latest["incidents"],
                previous["incidents"],
            ),
            description=(
                "Latest recordable incident "
                "count from safety data."
            ),
        ),
        _build_driver(
            name="Near Misses",
            value=latest["near_misses"],
            unit="",
            change=_absolute_change(
                latest["near_misses"],
                previous["near_misses"],
            ),
            description=(
                "Latest near-miss count from "
                "the reporting period."
            ),
        ),
        _build_driver(
            name="Critical Risks",
            value=latest["critical_risks"],
            unit="",
            change=_absolute_change(
                latest["critical_risks"],
                previous["critical_risks"],
            ),
            description=(
                "Latest open critical-risk "
                "count from safety data."
            ),
        ),
    ]


def _build_mine_health_drivers(
    db: Session,
    mine_name: str,
) -> List[Dict]:
    production_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                ore_actual,
                ore_plan,
                waste_actual,
                waste_plan
            FROM public.production_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    fleet_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                availability,
                utilization
            FROM public.fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    plant_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_actual,
                throughput_plan,
                recovery
            FROM public.plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    safety_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                safety_score
            FROM public.safety_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 2
            """
        ),
        {
            "mine_name": mine_name,
        },
    ).mappings().all()

    if not production_rows:
        return []

    latest_production = production_rows[0]
    previous_production = (
        production_rows[1]
        if len(production_rows) > 1
        else production_rows[0]
    )

    latest_ore = safe_percentage(
        latest_production["ore_actual"],
        latest_production["ore_plan"],
    )

    previous_ore = safe_percentage(
        previous_production["ore_actual"],
        previous_production["ore_plan"],
    )

    latest_waste = safe_percentage(
        latest_production["waste_actual"],
        latest_production["waste_plan"],
    )

    previous_waste = safe_percentage(
        previous_production["waste_actual"],
        previous_production["waste_plan"],
    )

    latest_fleet = 0.0
    previous_fleet = 0.0

    if fleet_rows:
        latest_fleet = (
            calculate_fleet_score(
                fleet_rows[0]["availability"],
                fleet_rows[0]["utilization"],
            )
        )

        fleet_previous_row = (
            fleet_rows[1]
            if len(fleet_rows) > 1
            else fleet_rows[0]
        )

        previous_fleet = (
            calculate_fleet_score(
                fleet_previous_row[
                    "availability"
                ],
                fleet_previous_row[
                    "utilization"
                ],
            )
        )

    latest_plant = 0.0
    previous_plant = 0.0

    if plant_rows:
        latest_plant, _, _ = (
            calculate_plant_score(
                plant_rows[0][
                    "throughput_actual"
                ],
                plant_rows[0][
                    "throughput_plan"
                ],
                plant_rows[0][
                    "recovery"
                ],
            )
        )

        plant_previous_row = (
            plant_rows[1]
            if len(plant_rows) > 1
            else plant_rows[0]
        )

        previous_plant, _, _ = (
            calculate_plant_score(
                plant_previous_row[
                    "throughput_actual"
                ],
                plant_previous_row[
                    "throughput_plan"
                ],
                plant_previous_row[
                    "recovery"
                ],
            )
        )

    latest_safety = (
        _safe_float(
            safety_rows[0][
                "safety_score"
            ]
        )
        if safety_rows
        else 0.0
    )

    previous_safety = (
        _safe_float(
            (
                safety_rows[1]
                if len(safety_rows) > 1
                else safety_rows[0]
            )["safety_score"]
        )
        if safety_rows
        else 0.0
    )

    return [
        _build_driver(
            name="Ore Performance",
            value=latest_ore,
            unit="%",
            change=_absolute_change(
                latest_ore,
                previous_ore,
            ),
            description=(
                "Latest ore production "
                "plan-attainment score."
            ),
        ),
        _build_driver(
            name="Waste Movement",
            value=latest_waste,
            unit="%",
            change=_absolute_change(
                latest_waste,
                previous_waste,
            ),
            description=(
                "Latest waste movement "
                "plan-attainment score."
            ),
        ),
        _build_driver(
            name="Fleet Performance",
            value=latest_fleet,
            unit="%",
            change=_absolute_change(
                latest_fleet,
                previous_fleet,
            ),
            description=(
                "Latest combined fleet "
                "performance score."
            ),
        ),
        _build_driver(
            name="Plant Performance",
            value=latest_plant,
            unit="%",
            change=_absolute_change(
                latest_plant,
                previous_plant,
            ),
            description=(
                "Latest combined plant "
                "performance score."
            ),
        ),
        _build_driver(
            name="Safety Score",
            value=latest_safety,
            unit="%",
            change=_absolute_change(
                latest_safety,
                previous_safety,
            ),
            description=(
                "Latest safety score from "
                "the operational dataset."
            ),
        ),
    ]


def _build_operational_drivers(
    db: Session,
    mine_name: str,
    kpi_name: str,
) -> List[Dict]:
    if kpi_name == "mine_health":
        return _build_mine_health_drivers(
            db=db,
            mine_name=mine_name,
        )

    if kpi_name in {
        "ore",
        "waste",
    }:
        return _build_production_drivers(
            db=db,
            mine_name=mine_name,
            metric=kpi_name,
        )

    if kpi_name == "fleet":
        return _build_fleet_drivers(
            db=db,
            mine_name=mine_name,
        )

    if kpi_name == "plant":
        return _build_plant_drivers(
            db=db,
            mine_name=mine_name,
        )

    if kpi_name == "safety":
        return _build_safety_drivers(
            db=db,
            mine_name=mine_name,
        )

    return []


# --------------------------------------------------
# Live Fleet Diagnostic Intelligence
# --------------------------------------------------

def _build_fleet_diagnostics(
    daily_values: List[Dict],
    operational_drivers: List[Dict],
    target: float,
) -> Dict:
    """
    Build evidence-based live Fleet diagnostic intelligence.

    Uses only live KPI history and structured Fleet operational
    drivers already available from PostgreSQL. It intentionally
    avoids inventing maintenance, dispatch, weather, or equipment
    causes when those data are not available.
    """

    if not daily_values:
        return {
            "executive_insight": (
                "No Fleet diagnostic insight is available "
                "because no valid historical data was found."
            ),
            "confidence": 0.0,
            "confidence_label":
                "Insufficient live data",
            "risk_level": "unknown",
            "root_causes": [],
            "positive_drivers": [],
            "forecast": (
                "No forward outlook is available."
            ),
        }

    values = [
        _safe_float(
            item.get("value")
        )
        for item in daily_values
    ]

    current_value = values[-1]
    first_value = values[0]

    overall_change = round(
        current_value - first_value,
        2,
    )

    target_value = _safe_float(
        target
    )

    target_variance = round(
        current_value - target_value,
        2,
    )

    improving = overall_change > 0
    declining = overall_change < 0
    above_target = (
        current_value >= target_value
    )

    positive_drivers: List[str] = []

    for driver in operational_drivers:
        if not isinstance(
            driver,
            dict,
        ):
            continue

        driver_change = _safe_float(
            driver.get("change")
        )

        if driver_change > 0:
            positive_drivers.append(
                str(
                    driver.get("name")
                    or "Operational driver"
                )
            )

    root_causes: List[Dict] = []

    if not above_target:
        candidate_causes = []

        for driver in operational_drivers:
            if not isinstance(
                driver,
                dict,
            ):
                continue

            name = str(
                driver.get("name")
                or "Fleet driver"
            )

            value = _safe_float(
                driver.get("value")
            )

            change = _safe_float(
                driver.get("change")
            )

            # Do not present the KPI itself as a cause of itself.
            if (
                name.lower()
                == "fleet performance"
            ):
                continue

            if (
                change < 0
                or value < target_value
            ):
                candidate_causes.append(
                    {
                        "name": name,
                        "value": value,
                        "change": change,
                    }
                )

        candidate_causes.sort(
            key=lambda item: (
                item["value"]
                - target_value,
                item["change"],
            )
        )

        for index, item in enumerate(
            candidate_causes[:3],
            start=1,
        ):
            name = item["name"]
            value = item["value"]
            change = item["change"]

            gap_to_target = round(
                target_value - value,
                1,
            )

            if (
                gap_to_target >= 5
                or change <= -3
            ):
                impact = "High"
            elif (
                gap_to_target >= 1
                or change < 0
            ):
                impact = "Medium"
            else:
                impact = "Low"

            cause_confidence = min(
                0.90,
                0.72
                + min(
                    len(values),
                    7,
                ) * 0.02,
            )

            root_causes.append(
                {
                    "rank": index,
                    "cause": name,
                    "category": "Fleet",
                    "impact": impact,
                    "confidence": round(
                        cause_confidence,
                        2,
                    ),
                    "evidence": (
                        f"{name} is currently "
                        f"{value:.1f}% with a "
                        f"{change:+.1f} "
                        "percentage-point movement "
                        "versus the previous "
                        "reporting day."
                    ),
                    "operational_effect": (
                        "This measured Fleet driver "
                        "may be contributing to the "
                        "current Fleet performance "
                        "gap."
                    ),
                }
            )

    observation_count = len(values)

    confidence = (
        0.65
        + min(
            observation_count,
            7,
        ) * 0.03
    )

    if improving or declining:
        confidence += 0.04

    confidence = round(
        min(
            0.90,
            confidence,
        ),
        2,
    )

    if above_target and improving:
        risk_level = "low"

        executive_insight = (
            f"Fleet performance is "
            f"{current_value:.1f}% against a "
            f"{target_value:.1f}% target and has "
            f"improved by {overall_change:.1f} "
            "percentage points over the reporting "
            "period. Availability and utilization "
            "are both supporting the current "
            "recovery. No material negative Fleet "
            "performance gap is currently identified."
        )

        forecast = (
            "Current recovery momentum supports "
            "continued above-target Fleet performance "
            "if availability and utilization are "
            "sustained."
        )

    elif above_target:
        risk_level = "low"

        executive_insight = (
            f"Fleet performance is "
            f"{current_value:.1f}% against a "
            f"{target_value:.1f}% target. "
            "Performance remains above target, "
            "although the recent trend should "
            "continue to be monitored."
        )

        forecast = (
            "Fleet performance is currently above "
            "target. Continued monitoring of "
            "availability and utilization is required "
            "to confirm sustainability."
        )

    elif improving:
        risk_level = "medium"

        executive_insight = (
            f"Fleet performance is "
            f"{current_value:.1f}% against a "
            f"{target_value:.1f}% target. "
            f"The KPI remains "
            f"{abs(target_variance):.1f} percentage "
            "points below target but has improved by "
            f"{overall_change:.1f} percentage points "
            "over the reporting period."
        )

        forecast = (
            "The current recovery trend is positive, "
            "but Fleet performance remains below "
            "target. Sustained improvement in the "
            "measured Fleet drivers is required."
        )

    else:
        risk_level = "high"

        if declining:
            trend_text = (
                f"and has declined by "
                f"{abs(overall_change):.1f} "
                "percentage points over the "
                "reporting period"
            )
        else:
            trend_text = (
                "and has remained broadly flat "
                "over the reporting period"
            )

        executive_insight = (
            f"Fleet performance is "
            f"{current_value:.1f}% against a "
            f"{target_value:.1f}% target "
            f"{trend_text}. Management review "
            "of the measured Fleet drivers "
            "is required."
        )

        forecast = (
            "Without improvement in Fleet "
            "availability and utilization, the "
            "current performance gap may persist "
            "into the next reporting period."
        )

    return {
        "executive_insight":
            executive_insight,

        "confidence":
            confidence,

        "confidence_label":
            "Rule-based live-data confidence",

        "risk_level":
            risk_level,

        "root_causes":
            root_causes,

        "positive_drivers":
            positive_drivers,

        "forecast":
            forecast,
    }


# --------------------------------------------------
# Live Fleet Recommendation Intelligence
# --------------------------------------------------

def _build_fleet_recommendations(
    diagnostics: Dict,
    operational_drivers: List[Dict],
    target: float,
) -> List[str]:
    """
    Build corrective Fleet recommendations from live evidence.

    Healthy Fleet performance should not create corrective actions.
    Recommendations are generated only when the live diagnostic
    result identifies a performance gap or material measured driver.

    This function intentionally avoids unsupported maintenance,
    dispatch, weather, or equipment-specific conclusions.
    """

    risk_level = str(
        diagnostics.get(
            "risk_level",
            "unknown",
        )
        or "unknown"
    ).strip().lower()

    root_causes = (
        diagnostics.get(
            "root_causes"
        )
        or []
    )

    target_value = _safe_float(
        target
    )

    # Healthy / low-risk performance with no material root cause:
    # no corrective action should be created.
    if (
        risk_level == "low"
        and not root_causes
    ):
        return []

    recommendations: List[str] = []

    def add_unique(
        recommendation: str,
    ) -> None:
        text_value = str(
            recommendation or ""
        ).strip()

        if (
            text_value
            and text_value
            not in recommendations
        ):
            recommendations.append(
                text_value
            )

    # Build actions from identified root causes first.
    for cause in root_causes:
        if not isinstance(
            cause,
            dict,
        ):
            continue

        cause_name = str(
            cause.get("cause")
            or cause.get("name")
            or ""
        ).strip().lower()

        if "availability" in cause_name:
            add_unique(
                "Review Fleet availability losses and "
                "restore equipment readiness to support "
                "the configured Fleet target."
            )

        elif "utilization" in cause_name:
            add_unique(
                "Review Fleet utilization losses, idle "
                "time, and operating allocation to "
                "recover productive operating time."
            )

    # If the KPI is below target but root-cause detail is limited,
    # use only measured Fleet drivers to provide bounded guidance.
    if not recommendations:
        for driver in operational_drivers:
            if not isinstance(
                driver,
                dict,
            ):
                continue

            name = str(
                driver.get("name")
                or ""
            ).strip()

            normalized_name = (
                name.lower()
            )

            # Fleet Performance is the KPI itself, not a cause.
            if normalized_name == (
                "fleet performance"
            ):
                continue

            value = _safe_float(
                driver.get("value")
            )

            change = _safe_float(
                driver.get("change")
            )

            is_material_gap = (
                value < target_value
                or change < 0
            )

            if not is_material_gap:
                continue

            if "availability" in normalized_name:
                add_unique(
                    "Review Fleet availability losses and "
                    "restore equipment readiness to support "
                    "the configured Fleet target."
                )

            elif "utilization" in normalized_name:
                add_unique(
                    "Review Fleet utilization losses, idle "
                    "time, and operating allocation to "
                    "recover productive operating time."
                )

    # Final evidence-bounded fallback for a below-target Fleet KPI.
    if (
        not recommendations
        and risk_level in {
            "medium",
            "high",
        }
    ):
        add_unique(
            "Review Fleet availability and utilization "
            "performance against the configured target "
            "and assign an owner for the next reporting "
            "period."
        )

    return recommendations[:3]

def get_kpi_detail(
    db: Session,
    mine_name: str,
    kpi_name: str,
    days: int = 7,
) -> Dict:
    normalized_mine_name = (
        mine_name.strip()
        if mine_name
        else "Oyu Tolgoi Surface"
    )

    normalized_kpi_name = (
        str(kpi_name or "")
        .strip()
        .lower()
    )

    aliases = {
        "mine health":
            "mine_health",

        "mine_health":
            "mine_health",

        "ore":
            "ore",

        "ore production":
            "ore",

        "ore performance":
            "ore",

        "waste":
            "waste",

        "waste movement":
            "waste",

        "fleet":
            "fleet",

        "fleet performance":
            "fleet",

        "plant":
            "plant",

        "plant performance":
            "plant",

        "safety":
            "safety",

        "safety incidents":
            "safety",
    }

    normalized_kpi_name = (
        aliases.get(
            normalized_kpi_name,
            normalized_kpi_name,
        )
    )

    config = KPI_CONFIG.get(
        normalized_kpi_name
    )

    if not config:
        raise ValueError(
            f"Unsupported KPI: "
            f"{kpi_name}"
        )

    if normalized_kpi_name == (
        "mine_health"
    ):
        daily_values = (
            _mine_health_history(
                db=db,
                mine_name=
                    normalized_mine_name,
                days=days,
            )
        )

    elif normalized_kpi_name in {
        "ore",
        "waste",
    }:
        daily_values = (
            _production_history(
                db=db,
                mine_name=
                    normalized_mine_name,
                days=days,
                metric=
                    normalized_kpi_name,
            )
        )

    elif normalized_kpi_name == (
        "fleet"
    ):
        daily_values = (
            _fleet_history(
                db=db,
                mine_name=
                    normalized_mine_name,
                days=days,
            )
        )

    elif normalized_kpi_name == (
        "plant"
    ):
        daily_values = (
            _plant_history(
                db=db,
                mine_name=
                    normalized_mine_name,
                days=days,
            )
        )

    elif normalized_kpi_name == (
        "safety"
    ):
        daily_values = (
            _safety_history(
                db=db,
                mine_name=
                    normalized_mine_name,
                days=days,
            )
        )

    else:
        daily_values = []

    if not daily_values:
        raise ValueError(
            f"No KPI data available for "
            f"{normalized_mine_name}: "
            f"{kpi_name}"
        )

    numeric_values = [
        _safe_float(
            item.get("value")
        )
        for item in daily_values
    ]

    current_value = (
        numeric_values[-1]
    )

    change_data = (
        _calculate_change(
            numeric_values
        )
    )

    operational_drivers = (
        _build_operational_drivers(
            db=db,
            mine_name=normalized_mine_name,
            kpi_name=normalized_kpi_name,
        )
    )

    diagnostics: Dict = {}

    if normalized_kpi_name == "fleet":
        diagnostics = (
            _build_fleet_diagnostics(
                daily_values=daily_values,
                operational_drivers=
                    operational_drivers,
                target=config["target"],
            )
        )

    recommendations = (
        _build_fleet_recommendations(
            diagnostics=diagnostics,
            operational_drivers=
                operational_drivers,
            target=config["target"],
        )
        if normalized_kpi_name == "fleet"
        else list(
            config[
                "recommendations"
            ]
        )
    )

    return {
        "kpi_name":
            config["title"],

        "current_value":
            current_value,

        "target":
            config["target"],

        "unit":
            config["unit"],

        "change":
            change_data["change"],

        "change_percent":
            change_data[
                "change_percent"
            ],

        "direction":
            change_data[
                "direction"
            ],

        "period_label":
            _build_period_label(
                len(
                    daily_values
                )
            ),

        "daily_values":
            daily_values,

        "operational_drivers":
            operational_drivers,

        "top_drivers":
            operational_drivers,

        "recommendations":
            recommendations,

        "executive_insight":
            diagnostics.get(
                "executive_insight"
            ),

        "confidence":
            diagnostics.get(
                "confidence"
            ),

        "confidence_label":
            diagnostics.get(
                "confidence_label"
            ),

        "risk_level":
            diagnostics.get(
                "risk_level"
            ),

        "root_causes":
            diagnostics.get(
                "root_causes",
                [],
            ),

        "positive_drivers":
            diagnostics.get(
                "positive_drivers",
                [],
            ),

        "forecast":
            diagnostics.get(
                "forecast"
            ),
    }