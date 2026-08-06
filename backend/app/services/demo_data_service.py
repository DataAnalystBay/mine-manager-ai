from datetime import date, timedelta
import random
from typing import Any, Dict, List


DEFAULT_SCENARIO = "High Performing Mine"
DEFAULT_MINE_NAME = "Oyu Tolgoi Surface"

SUPPORTED_SCENARIOS = {
    "High Performing Mine",
    "Fleet Breakdown",
    "Plant Bottleneck",
    "Safety Incident",
    "Heavy Rain / Weather Delay",
    "Winter Operations",
}


# --------------------------------------------------
# Shared Helpers
# --------------------------------------------------

def _normalize_text(
    value: Any,
    default: str,
) -> str:
    """
    Normalize an incoming text value and return
    the supplied default when empty.
    """

    normalized = str(value or "").strip()

    return normalized or default


def _normalize_days(days: int) -> int:
    """
    Ensure the requested reporting period is valid.
    """

    try:
        normalized_days = int(days)
    except (TypeError, ValueError):
        normalized_days = 30

    return max(1, min(normalized_days, 365))


def _report_date(
    today: date,
    days: int,
    index: int,
) -> date:
    """
    Return the reporting date for one generated record.
    """

    return today - timedelta(
        days=days - index - 1
    )


def _progress_ratio(
    index: int,
    days: int,
) -> float:
    """
    Return a zero-to-one progress ratio across
    the requested reporting period.
    """

    if days <= 1:
        return 1.0

    return index / (days - 1)


def _interpolate(
    start: float,
    end: float,
    progress: float,
) -> float:
    """
    Interpolate between a start and end value.
    """

    return start + (
        end - start
    ) * progress


# --------------------------------------------------
# Generic Demo Generators
# --------------------------------------------------

def generate_production_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate generic production demo records.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        ore_plan = random.randint(
            48000,
            54000,
        )

        ore_actual = int(
            ore_plan
            * random.uniform(
                0.92,
                1.06,
            )
        )

        waste_plan = random.randint(
            90000,
            105000,
        )

        waste_actual = int(
            waste_plan
            * random.uniform(
                0.90,
                1.08,
            )
        )

        data.append({
            "report_date": report_date.isoformat(),
            "ore_plan": ore_plan,
            "ore_actual": ore_actual,
            "waste_plan": waste_plan,
            "waste_actual": waste_actual,
        })

    return data


def generate_fleet_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate generic fleet demo records.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    trucks = [
        "CAT793-01",
        "CAT793-02",
        "CAT793-03",
        "CAT793-04",
        "CAT793-05",
    ]

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        for truck in trucks:
            data.append({
                "report_date": report_date.isoformat(),
                "truck_id": truck,
                "availability": round(
                    random.uniform(
                        82,
                        96,
                    ),
                    1,
                ),
                "utilization": round(
                    random.uniform(
                        70,
                        90,
                    ),
                    1,
                ),
                "breakdown_hours": round(
                    random.uniform(
                        0,
                        5,
                    ),
                    1,
                ),
                "idle_hours": round(
                    random.uniform(
                        1,
                        6,
                    ),
                    1,
                ),
            })

    return data


def generate_plant_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate generic plant demo records.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        throughput_plan = random.randint(
            42000,
            48000,
        )

        throughput_actual = int(
            throughput_plan
            * random.uniform(
                0.91,
                1.05,
            )
        )

        data.append({
            "report_date": report_date.isoformat(),
            "throughput_plan": throughput_plan,
            "throughput_actual": throughput_actual,
            "recovery": round(
                random.uniform(
                    87,
                    93,
                ),
                1,
            ),
            "downtime_hours": round(
                random.uniform(
                    0,
                    4,
                ),
                1,
            ),
        })

    return data


def generate_safety_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate generic safety demo records.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        data.append({
            "report_date": report_date.isoformat(),
            "near_misses": random.randint(
                0,
                4,
            ),
            "hazards_reported": random.randint(
                3,
                12,
            ),
            "open_actions": random.randint(
                2,
                15,
            ),
            "critical_risks": random.randint(
                0,
                3,
            ),
            "recordable_incidents": random.choice(
                [0, 0, 0, 0, 1]
            ),
        })

    return data


def generate_maintenance_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate generic maintenance demo records.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        data.append({
            "report_date": report_date.isoformat(),
            "pm_compliance": round(
                random.uniform(
                    78,
                    96,
                ),
                1,
            ),
            "backlog_work_orders": random.randint(
                20,
                80,
            ),
            "planned_work_percent": round(
                random.uniform(
                    55,
                    82,
                ),
                1,
            ),
            "unplanned_work_percent": round(
                random.uniform(
                    18,
                    45,
                ),
                1,
            ),
            "equipment_availability": round(
                random.uniform(
                    80,
                    94,
                ),
                1,
            ),
        })

    return data


def generate_workforce_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate generic workforce demo records.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        data.append({
            "report_date": report_date.isoformat(),
            "attendance_rate": round(
                random.uniform(
                    88,
                    98,
                ),
                1,
            ),
            "overtime_hours": random.randint(
                80,
                240,
            ),
            "fatigue_cases": random.randint(
                0,
                5,
            ),
            "training_compliance": round(
                random.uniform(
                    82,
                    99,
                ),
                1,
            ),
            "contractor_headcount": random.randint(
                120,
                220,
            ),
        })

    return data


# --------------------------------------------------
# Fleet Breakdown Scenario Generators
# --------------------------------------------------

def generate_fleet_breakdown_production_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate deterministic production degradation caused
    by a major fleet availability problem.

    The scenario gradually declines toward:
        - Ore performance around 94%
        - Waste performance around 90%
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        progress = _progress_ratio(
            i,
            days,
        )

        ore_plan = 52000 + (
            (i % 5) * 250
        )

        waste_plan = 100000 + (
            (i % 4) * 500
        )

        ore_ratio = _interpolate(
            1.01,
            0.94,
            progress,
        )

        waste_ratio = _interpolate(
            1.00,
            0.90,
            progress,
        )

        ore_actual = int(
            ore_plan * ore_ratio
        )

        waste_actual = int(
            waste_plan * waste_ratio
        )

        data.append({
            "report_date": report_date.isoformat(),
            "ore_plan": ore_plan,
            "ore_actual": ore_actual,
            "waste_plan": waste_plan,
            "waste_actual": waste_actual,
        })

    return data


def generate_fleet_breakdown_fleet_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate deterministic fleet records representing
    worsening availability and unplanned downtime.

    Latest-period fleet averages are designed to finish
    around:
        - Availability: 68–71%
        - Utilization: 70–73%
        - Breakdown hours: 7–11 hours
        - Idle hours: 4–7 hours
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    trucks = [
        "CAT793-01",
        "CAT793-02",
        "CAT793-03",
        "CAT793-04",
        "CAT793-05",
    ]

    truck_offsets = {
        "CAT793-01": {
            "availability": -1.0,
            "utilization": -0.8,
            "breakdown": 0.8,
            "idle": 0.4,
        },
        "CAT793-02": {
            "availability": -2.5,
            "utilization": -1.8,
            "breakdown": 2.0,
            "idle": 0.8,
        },
        "CAT793-03": {
            "availability": 0.5,
            "utilization": 0.4,
            "breakdown": -0.3,
            "idle": -0.2,
        },
        "CAT793-04": {
            "availability": -4.0,
            "utilization": -3.0,
            "breakdown": 3.0,
            "idle": 1.4,
        },
        "CAT793-05": {
            "availability": 1.2,
            "utilization": 0.8,
            "breakdown": -0.6,
            "idle": -0.4,
        },
    }

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        progress = _progress_ratio(
            i,
            days,
        )

        base_availability = _interpolate(
            92.0,
            70.0,
            progress,
        )

        base_utilization = _interpolate(
            86.0,
            72.0,
            progress,
        )

        base_breakdown = _interpolate(
            1.5,
            8.0,
            progress,
        )

        base_idle = _interpolate(
            2.0,
            5.2,
            progress,
        )

        for truck in trucks:
            offsets = truck_offsets[truck]

            availability = max(
                50.0,
                min(
                    100.0,
                    base_availability
                    + offsets["availability"],
                ),
            )

            utilization = max(
                45.0,
                min(
                    100.0,
                    base_utilization
                    + offsets["utilization"],
                ),
            )

            breakdown_hours = max(
                0.0,
                base_breakdown
                + offsets["breakdown"],
            )

            idle_hours = max(
                0.0,
                base_idle
                + offsets["idle"],
            )

            data.append({
                "report_date": report_date.isoformat(),
                "truck_id": truck,
                "availability": round(
                    availability,
                    1,
                ),
                "utilization": round(
                    utilization,
                    1,
                ),
                "breakdown_hours": round(
                    breakdown_hours,
                    1,
                ),
                "idle_hours": round(
                    idle_hours,
                    1,
                ),
            })

    return data


def generate_fleet_breakdown_maintenance_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate deterministic maintenance deterioration
    associated with the fleet breakdown scenario.

    Latest-period values finish around:
        - PM compliance: 76%
        - Backlog: 78 work orders
        - Planned work: 52%
        - Unplanned work: 48%
        - Equipment availability: 69%
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        progress = _progress_ratio(
            i,
            days,
        )

        pm_compliance = _interpolate(
            92.0,
            76.0,
            progress,
        )

        backlog = round(
            _interpolate(
                28,
                78,
                progress,
            )
        )

        planned_work = _interpolate(
            78.0,
            52.0,
            progress,
        )

        unplanned_work = _interpolate(
            22.0,
            48.0,
            progress,
        )

        equipment_availability = _interpolate(
            91.0,
            69.0,
            progress,
        )

        data.append({
            "report_date": report_date.isoformat(),
            "pm_compliance": round(
                pm_compliance,
                1,
            ),
            "backlog_work_orders": int(
                backlog
            ),
            "planned_work_percent": round(
                planned_work,
                1,
            ),
            "unplanned_work_percent": round(
                unplanned_work,
                1,
            ),
            "equipment_availability": round(
                equipment_availability,
                1,
            ),
        })

    return data


def generate_fleet_breakdown_plant_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Keep plant performance close to target so the main
    operational constraint remains clearly fleet-related.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        progress = _progress_ratio(
            i,
            days,
        )

        throughput_plan = 45500 + (
            (i % 4) * 150
        )

        throughput_ratio = _interpolate(
            1.01,
            0.97,
            progress,
        )

        throughput_actual = int(
            throughput_plan
            * throughput_ratio
        )

        recovery = _interpolate(
            91.8,
            90.2,
            progress,
        )

        downtime_hours = _interpolate(
            1.0,
            2.2,
            progress,
        )

        data.append({
            "report_date": report_date.isoformat(),
            "throughput_plan": throughput_plan,
            "throughput_actual": throughput_actual,
            "recovery": round(
                recovery,
                1,
            ),
            "downtime_hours": round(
                downtime_hours,
                1,
            ),
        })

    return data


def generate_fleet_breakdown_safety_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Keep safety incidents at zero while slightly increasing
    hazards and open actions due to operational pressure.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        progress = _progress_ratio(
            i,
            days,
        )

        hazards_reported = round(
            _interpolate(
                5,
                11,
                progress,
            )
        )

        open_actions = round(
            _interpolate(
                4,
                13,
                progress,
            )
        )

        critical_risks = (
            1
            if progress < 0.75
            else 2
        )

        data.append({
            "report_date": report_date.isoformat(),
            "near_misses": 1 if i % 6 == 0 else 0,
            "hazards_reported": int(
                hazards_reported
            ),
            "open_actions": int(
                open_actions
            ),
            "critical_risks": critical_risks,
            "recordable_incidents": 0,
        })

    return data


def generate_fleet_breakdown_workforce_demo(
    days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Generate modest workforce pressure caused by extended
    maintenance recovery work.
    """

    data: List[Dict[str, Any]] = []
    today = date.today()
    days = _normalize_days(days)

    for i in range(days):
        report_date = _report_date(
            today,
            days,
            i,
        )

        progress = _progress_ratio(
            i,
            days,
        )

        attendance_rate = _interpolate(
            96.0,
            92.0,
            progress,
        )

        overtime_hours = round(
            _interpolate(
                110,
                225,
                progress,
            )
        )

        fatigue_cases = (
            1
            if progress < 0.50
            else 3
        )

        training_compliance = _interpolate(
            96.0,
            91.0,
            progress,
        )

        contractor_headcount = round(
            _interpolate(
                150,
                185,
                progress,
            )
        )

        data.append({
            "report_date": report_date.isoformat(),
            "attendance_rate": round(
                attendance_rate,
                1,
            ),
            "overtime_hours": int(
                overtime_hours
            ),
            "fatigue_cases": fatigue_cases,
            "training_compliance": round(
                training_compliance,
                1,
            ),
            "contractor_headcount": int(
                contractor_headcount
            ),
        })

    return data


# --------------------------------------------------
# Main Demo Dataset Generator
# --------------------------------------------------

def generate_all_demo_data(
    scenario: str = DEFAULT_SCENARIO,
    mine_name: str = DEFAULT_MINE_NAME,
    days: int = 30,
) -> Dict[str, Any]:
    """
    Generate the complete Demo Mode dataset.

    Fleet Breakdown is now deterministic so all related
    dashboard metrics tell one consistent operational
    story.

    Other scenarios continue using the generic generators
    until their dedicated implementations are added.
    """

    normalized_scenario = _normalize_text(
        scenario,
        DEFAULT_SCENARIO,
    )

    normalized_mine_name = _normalize_text(
        mine_name,
        DEFAULT_MINE_NAME,
    )

    normalized_days = _normalize_days(
        days
    )

    if (
        normalized_scenario
        not in SUPPORTED_SCENARIOS
    ):
        normalized_scenario = DEFAULT_SCENARIO

    if normalized_scenario == "Fleet Breakdown":
        production = (
            generate_fleet_breakdown_production_demo(
                days=normalized_days,
            )
        )

        fleet = (
            generate_fleet_breakdown_fleet_demo(
                days=normalized_days,
            )
        )

        plant = (
            generate_fleet_breakdown_plant_demo(
                days=normalized_days,
            )
        )

        safety = (
            generate_fleet_breakdown_safety_demo(
                days=normalized_days,
            )
        )

        maintenance = (
            generate_fleet_breakdown_maintenance_demo(
                days=normalized_days,
            )
        )

        workforce = (
            generate_fleet_breakdown_workforce_demo(
                days=normalized_days,
            )
        )

        scenario_status = (
            "fleet_breakdown_deterministic"
        )

    else:
        production = generate_production_demo(
            days=normalized_days,
        )

        fleet = generate_fleet_demo(
            days=normalized_days,
        )

        plant = generate_plant_demo(
            days=normalized_days,
        )

        safety = generate_safety_demo(
            days=normalized_days,
        )

        maintenance = generate_maintenance_demo(
            days=normalized_days,
        )

        workforce = generate_workforce_demo(
            days=normalized_days,
        )

        scenario_status_map = {
            "High Performing Mine":
                "high_performing_generic",

            "Plant Bottleneck":
                "plant_bottleneck_branch_ready",

            "Safety Incident":
                "safety_incident_branch_ready",

            "Heavy Rain / Weather Delay":
                "weather_delay_branch_ready",

            "Winter Operations":
                "winter_operations_branch_ready",
        }

        scenario_status = scenario_status_map.get(
            normalized_scenario,
            "generic_demo_data",
        )

    return {
        "scenario": normalized_scenario,
        "scenario_status": scenario_status,
        "mine_name": normalized_mine_name,
        "reporting_days": normalized_days,
        "production": production,
        "fleet": fleet,
        "plant": plant,
        "safety": safety,
        "maintenance": maintenance,
        "workforce": workforce,
    }