from datetime import date, timedelta
import math
import random
from typing import Any, Dict, List, Optional


# ============================================================
# Demo Configuration
# ============================================================

DEFAULT_SCENARIO = "High Performing Mine"
DEFAULT_MINE_NAME = "Achit Ikht LLC"

HISTORICAL_START_DATE = date(2021, 1, 1)
MAX_HISTORY_DAYS = 3650

# Fixed seed keeps the synthetic history repeatable.
DEMO_RANDOM_SEED = 20210821


# ============================================================
# Synthetic Performance Calibration
# ============================================================

# These are generator calibration values.
#
# Business objective for the generated history:
#   Production attainment       ≈ 95%
#   Plant throughput attainment ≈ 95%
#
# They are not claims about Achit Ikht LLC's actual historical
# operating performance.

PRODUCTION_ATTAINMENT_BASE = 0.960
PLANT_THROUGHPUT_ATTAINMENT_BASE = 0.958


SUPPORTED_SCENARIOS = {
    "High Performing Mine",
    "Fleet Breakdown",
    "Plant Bottleneck",
    "Safety Incident",
    "Heavy Rain / Weather Delay",
    "Winter Operations",
}


# ============================================================
# Shared Helpers
# ============================================================

def _normalize_text(
    value: Any,
    default: str,
) -> str:
    normalized = str(value or "").strip()
    return normalized or default


def _historical_days(
    start_date: date = HISTORICAL_START_DATE,
    end_date: Optional[date] = None,
) -> int:
    """
    Return the number of calendar days from the historical
    start date through the requested end date, inclusive.
    """

    end_date = end_date or date.today()

    if end_date < start_date:
        return 1

    return (end_date - start_date).days + 1


def _normalize_days(
    days: Optional[int],
) -> int:
    """
    When days is omitted, generate the complete history from
    2021-01-01 through today.

    Explicit periods such as 30, 90 and 365 remain supported.
    """

    if days is None:
        return min(
            _historical_days(),
            MAX_HISTORY_DAYS,
        )

    try:
        normalized_days = int(days)
    except (TypeError, ValueError):
        normalized_days = _historical_days()

    return max(
        1,
        min(
            normalized_days,
            MAX_HISTORY_DAYS,
        ),
    )


def _report_date(
    today: date,
    days: int,
    index: int,
) -> date:
    return today - timedelta(
        days=days - index - 1
    )


def _interpolate(
    start: float,
    end: float,
    progress: float,
) -> float:
    return start + (end - start) * progress


def _clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


def _date_rng(
    report_date: date,
    salt: int = 0,
) -> random.Random:
    """
    Deterministic random generator for one date/domain.

    Resetting Demo Mode recreates the same operating history.
    """

    seed = (
        DEMO_RANDOM_SEED
        + report_date.toordinal()
        + salt
    )

    return random.Random(seed)


# ============================================================
# Long-Term Operating Behaviour
# ============================================================

def _seasonal_factor(
    report_date: date,
) -> float:
    """
    Small seasonal variation.

    Kept deliberately subtle so the history does not look
    mechanically generated.
    """

    day_of_year = report_date.timetuple().tm_yday

    seasonal_wave = math.sin(
        (2 * math.pi * day_of_year)
        / 365.25
    )

    return 1.0 + seasonal_wave * 0.012


def _long_term_performance_factor(
    report_date: date,
) -> float:
    """
    Synthetic operational maturity story.

    2021 - stabilization
    2022 - gradual improvement
    2023 - improving stability
    2024 - stronger operating discipline
    2025 - mature performance
    2026 - mature/stable performance
    """

    year_factors = {
        2021: 0.975,
        2022: 0.985,
        2023: 0.995,
        2024: 1.005,
        2025: 1.012,
        2026: 1.018,
    }

    if report_date.year in year_factors:
        return year_factors[
            report_date.year
        ]

    if report_date.year < 2021:
        return 0.975

    return 1.018


# ============================================================
# Operational Events
# ============================================================

def _operational_event_factor(
    report_date: date,
    salt: int = 0,
) -> Dict[str, Any]:
    """
    Create a realistic mixture of operating conditions.

    Approximate daily distribution:

      ~1%  major unplanned downtime
      ~3%  planned maintenance
      ~2.5% recovery/process issue
      ~9.5% minor operating loss
      ~14% strong performance
      remainder normal operation

    This gives the dashboard a healthier mixture of
    above-target and below-target days.
    """

    rng = _date_rng(
        report_date,
        1000 + salt,
    )

    event_roll = rng.random()

    event_type = "normal"
    factor = 1.0
    recovery_penalty = 0.0

    downtime_hours = rng.uniform(
        0.2,
        1.8,
    )

    # --------------------------------------------------------
    # Major unplanned downtime
    # --------------------------------------------------------

    if event_roll < 0.012:
        event_type = "major_unplanned_downtime"

        factor = rng.uniform(
            0.62,
            0.78,
        )

        recovery_penalty = rng.uniform(
            3.0,
            7.0,
        )

        downtime_hours = rng.uniform(
            5.5,
            11.0,
        )

    # --------------------------------------------------------
    # Planned maintenance
    # --------------------------------------------------------

    elif event_roll < 0.040:
        event_type = "planned_maintenance"

        factor = rng.uniform(
            0.78,
            0.90,
        )

        recovery_penalty = rng.uniform(
            0.5,
            2.5,
        )

        downtime_hours = rng.uniform(
            3.0,
            7.0,
        )

    # --------------------------------------------------------
    # Recovery / process loss
    # --------------------------------------------------------

    elif event_roll < 0.065:
        event_type = "recovery_loss"

        factor = rng.uniform(
            0.88,
            0.96,
        )

        recovery_penalty = rng.uniform(
            3.5,
            8.0,
        )

        downtime_hours = rng.uniform(
            1.0,
            3.5,
        )

    # --------------------------------------------------------
    # Minor operating loss
    # --------------------------------------------------------

    elif event_roll < 0.160:
        event_type = "minor_operating_loss"

        factor = rng.uniform(
            0.91,
            0.98,
        )

        recovery_penalty = rng.uniform(
            0.0,
            1.5,
        )

        downtime_hours = rng.uniform(
            1.0,
            3.5,
        )

    # --------------------------------------------------------
    # Strong operating day
    # --------------------------------------------------------

    elif event_roll > 0.860:
        event_type = "strong_performance"

        factor = rng.uniform(
            1.025,
            1.070,
        )

        recovery_penalty = 0.0

        downtime_hours = rng.uniform(
            0.0,
            0.8,
        )

    return {
        "event_type": event_type,
        "factor": factor,
        "recovery_penalty": recovery_penalty,
        "downtime_hours": downtime_hours,
    }


def _daily_operating_factor(
    report_date: date,
) -> float:
    """
    Shared operating factor used across operational domains.

    Production and Plant are therefore correlated without
    becoming mathematically identical.
    """

    rng = _date_rng(
        report_date,
        2000,
    )

    # Wider distribution allows normal operating days to
    # genuinely move above and below target.
    normal_noise = rng.gauss(
        1.008,
        0.028,
    )

    event = _operational_event_factor(
        report_date
    )

    factor = (
        _seasonal_factor(report_date)
        * _long_term_performance_factor(report_date)
        * normal_noise
        * event["factor"]
    )

    return _clamp(
        factor,
        0.55,
        1.12,
    )


# ============================================================
# Production Generator
# ============================================================

def generate_production_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Generate realistic multi-year Production history.
    """

    data: List[Dict[str, Any]] = []

    today = date.today()
    normalized_days = _normalize_days(days)

    for i in range(normalized_days):
        report_date = _report_date(
            today,
            normalized_days,
            i,
        )

        rng = _date_rng(
            report_date,
            10,
        )

        operating_factor = _daily_operating_factor(
            report_date
        )

        ore_plan = int(
            52000
            + rng.uniform(
                -1800,
                1800,
            )
        )

        waste_plan = int(
            100000
            + rng.uniform(
                -3500,
                3500,
            )
        )

        ore_ratio = (
            PRODUCTION_ATTAINMENT_BASE
            * operating_factor
        )

        ore_ratio = _clamp(
            ore_ratio,
            0.50,
            1.11,
        )

        waste_ratio = (
            0.96
            * (
                0.65
                + 0.35
                * operating_factor
            )
            * rng.uniform(
                0.97,
                1.03,
            )
        )

        waste_ratio = _clamp(
            waste_ratio,
            0.65,
            1.09,
        )

        data.append({
            "report_date":
                report_date.isoformat(),

            "ore_plan":
                ore_plan,

            "ore_actual":
                int(
                    ore_plan
                    * ore_ratio
                ),

            "waste_plan":
                waste_plan,

            "waste_actual":
                int(
                    waste_plan
                    * waste_ratio
                ),
        })

    return data


# ============================================================
# Plant Generator
# ============================================================

def generate_plant_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Generate realistic multi-year Plant history.

    Plant follows the same broad operating conditions as
    Production but has independent daily variation.
    """

    data: List[Dict[str, Any]] = []

    today = date.today()
    normalized_days = _normalize_days(days)

    for i in range(normalized_days):
        report_date = _report_date(
            today,
            normalized_days,
            i,
        )

        rng = _date_rng(
            report_date,
            20,
        )

        operating_factor = _daily_operating_factor(
            report_date
        )

        event = _operational_event_factor(
            report_date
        )

        throughput_plan = int(
            45500
            + rng.uniform(
                -1000,
                1000,
            )
        )

        # Plant-specific daily variation.
        plant_noise = rng.gauss(
            1.004,
            0.020,
        )

        # Give Plant meaningful exposure to the shared
        # operating condition without making it identical
        # to Production.
        throughput_ratio = (
            PLANT_THROUGHPUT_ATTAINMENT_BASE
            * (
                0.55
                + 0.45
                * operating_factor
            )
            * plant_noise
        )

        throughput_ratio = _clamp(
            throughput_ratio,
            0.55,
            1.10,
        )

        base_recovery = (
            89.8
            + (
                _long_term_performance_factor(
                    report_date
                )
                - 1.0
            )
            * 35
        )

        recovery = (
            base_recovery
            + rng.gauss(
                0,
                1.0,
            )
            - event[
                "recovery_penalty"
            ]
        )

        if (
            event["event_type"]
            == "strong_performance"
        ):
            recovery += rng.uniform(
                0.5,
                1.8,
            )

        recovery = _clamp(
            recovery,
            74.0,
            94.0,
        )

        downtime_hours = (
            event[
                "downtime_hours"
            ]
            + rng.uniform(
                -0.2,
                0.4,
            )
        )

        data.append({
            "report_date":
                report_date.isoformat(),

            "throughput_plan":
                throughput_plan,

            "throughput_actual":
                int(
                    throughput_plan
                    * throughput_ratio
                ),

            "recovery":
                round(
                    recovery,
                    1,
                ),

            "downtime_hours":
                round(
                    _clamp(
                        downtime_hours,
                        0.0,
                        12.0,
                    ),
                    1,
                ),
        })

    return data


# ============================================================
# Fleet Generator
# ============================================================

def generate_fleet_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Generate fleet history linked to the common operating
    environment.
    """

    data: List[Dict[str, Any]] = []

    today = date.today()
    normalized_days = _normalize_days(days)

    trucks = [
        "CAT793-01",
        "CAT793-02",
        "CAT793-03",
        "CAT793-04",
        "CAT793-05",
    ]

    truck_offsets = {
        "CAT793-01": -0.8,
        "CAT793-02": -1.4,
        "CAT793-03": 0.3,
        "CAT793-04": -2.0,
        "CAT793-05": 0.8,
    }

    for i in range(normalized_days):
        report_date = _report_date(
            today,
            normalized_days,
            i,
        )

        daily_factor = _daily_operating_factor(
            report_date
        )

        event = _operational_event_factor(
            report_date
        )

        for truck_index, truck in enumerate(
            trucks
        ):
            rng = _date_rng(
                report_date,
                100 + truck_index,
            )

            offset = truck_offsets[
                truck
            ]

            availability = (
                91.5
                + offset
                + (
                    daily_factor - 1.0
                )
                * 24
                + rng.gauss(
                    0,
                    1.4,
                )
            )

            utilization = (
                84.0
                + offset
                + (
                    daily_factor - 1.0
                )
                * 20
                + rng.gauss(
                    0,
                    1.8,
                )
            )

            breakdown_hours = max(
                0.0,
                (
                    100
                    - availability
                )
                / 4.5
                + rng.uniform(
                    0,
                    1.2,
                ),
            )

            if (
                event["event_type"]
                == "major_unplanned_downtime"
            ):
                breakdown_hours += (
                    rng.uniform(
                        2.0,
                        5.0,
                    )
                )

            idle_hours = max(
                0.0,
                (
                    90
                    - utilization
                )
                / 4.0
                + rng.uniform(
                    0.5,
                    2.0,
                ),
            )

            data.append({
                "report_date":
                    report_date.isoformat(),

                "truck_id":
                    truck,

                "availability":
                    round(
                        _clamp(
                            availability,
                            60.0,
                            98.0,
                        ),
                        1,
                    ),

                "utilization":
                    round(
                        _clamp(
                            utilization,
                            55.0,
                            95.0,
                        ),
                        1,
                    ),

                "breakdown_hours":
                    round(
                        _clamp(
                            breakdown_hours,
                            0.0,
                            12.0,
                        ),
                        1,
                    ),

                "idle_hours":
                    round(
                        _clamp(
                            idle_hours,
                            0.0,
                            10.0,
                        ),
                        1,
                    ),
            })

    return data


# ============================================================
# Safety Generator
# ============================================================

def generate_safety_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Generate healthy but non-perfect safety history.
    """

    data: List[Dict[str, Any]] = []

    today = date.today()
    normalized_days = _normalize_days(days)

    for i in range(normalized_days):
        report_date = _report_date(
            today,
            normalized_days,
            i,
        )

        rng = _date_rng(
            report_date,
            30,
        )

        pressure = (
            1.0
            - _daily_operating_factor(
                report_date
            )
        )

        near_misses = (
            1
            if rng.random()
            < (
                0.06
                + max(
                    0,
                    pressure,
                )
                * 0.30
            )
            else 0
        )

        if rng.random() < 0.012:
            near_misses += 1

        recordable_incidents = (
            1
            if rng.random() < 0.0025
            else 0
        )

        critical_risks = 0

        if (
            rng.random()
            < (
                0.018
                + max(
                    0,
                    pressure,
                )
                * 0.18
            )
        ):
            critical_risks = 1

        hazards_reported = rng.randint(
            3,
            8,
        )

        open_actions = (
            rng.randint(
                2,
                8,
            )
            + critical_risks
            * 2
        )

        data.append({
            "report_date":
                report_date.isoformat(),

            "near_misses":
                near_misses,

            "hazards_reported":
                hazards_reported,

            "open_actions":
                open_actions,

            "critical_risks":
                critical_risks,

            "recordable_incidents":
                recordable_incidents,
        })

    return data


# ============================================================
# Maintenance Generator
# ============================================================

def generate_maintenance_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Generate maintenance history related to operating
    performance.
    """

    data: List[Dict[str, Any]] = []

    today = date.today()
    normalized_days = _normalize_days(days)

    for i in range(normalized_days):
        report_date = _report_date(
            today,
            normalized_days,
            i,
        )

        rng = _date_rng(
            report_date,
            40,
        )

        operating_factor = _daily_operating_factor(
            report_date
        )

        weakness = max(
            0.0,
            1.0 - operating_factor,
        )

        pm_compliance = (
            92.0
            - weakness * 30
            + rng.gauss(
                0,
                1.5,
            )
        )

        backlog = (
            34
            + weakness * 110
            + rng.uniform(
                -6,
                6,
            )
        )

        planned_work = (
            76.0
            - weakness * 35
            + rng.gauss(
                0,
                2,
            )
        )

        planned_work = _clamp(
            planned_work,
            48.0,
            88.0,
        )

        unplanned_work = (
            100.0
            - planned_work
        )

        equipment_availability = (
            91.0
            - weakness * 40
            + rng.gauss(
                0,
                1.4,
            )
        )

        data.append({
            "report_date":
                report_date.isoformat(),

            "pm_compliance":
                round(
                    _clamp(
                        pm_compliance,
                        65.0,
                        98.0,
                    ),
                    1,
                ),

            "backlog_work_orders":
                int(
                    round(
                        _clamp(
                            backlog,
                            15,
                            100,
                        )
                    )
                ),

            "planned_work_percent":
                round(
                    planned_work,
                    1,
                ),

            "unplanned_work_percent":
                round(
                    unplanned_work,
                    1,
                ),

            "equipment_availability":
                round(
                    _clamp(
                        equipment_availability,
                        65.0,
                        97.0,
                    ),
                    1,
                ),
        })

    return data


# ============================================================
# Workforce Generator
# ============================================================

def generate_workforce_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Generate stable workforce history with realistic daily
    variation.
    """

    data: List[Dict[str, Any]] = []

    today = date.today()
    normalized_days = _normalize_days(days)

    for i in range(normalized_days):
        report_date = _report_date(
            today,
            normalized_days,
            i,
        )

        rng = _date_rng(
            report_date,
            50,
        )

        operating_factor = _daily_operating_factor(
            report_date
        )

        weakness = max(
            0.0,
            1.0 - operating_factor,
        )

        attendance_rate = (
            95.5
            - weakness * 10
            + rng.gauss(
                0,
                0.7,
            )
        )

        overtime_hours = (
            120
            + weakness * 260
            + rng.uniform(
                -20,
                25,
            )
        )

        fatigue_probability = (
            0.025
            + weakness * 0.20
        )

        fatigue_cases = (
            1
            if rng.random()
            < fatigue_probability
            else 0
        )

        if (
            weakness > 0.15
            and rng.random() < 0.15
        ):
            fatigue_cases += 1

        training_compliance = (
            96.0
            - weakness * 8
            + rng.gauss(
                0,
                0.8,
            )
        )

        contractor_headcount = (
            160
            + weakness * 60
            + rng.uniform(
                -8,
                8,
            )
        )

        data.append({
            "report_date":
                report_date.isoformat(),

            "attendance_rate":
                round(
                    _clamp(
                        attendance_rate,
                        85.0,
                        99.0,
                    ),
                    1,
                ),

            "overtime_hours":
                int(
                    round(
                        _clamp(
                            overtime_hours,
                            60,
                            300,
                        )
                    )
                ),

            "fatigue_cases":
                fatigue_cases,

            "training_compliance":
                round(
                    _clamp(
                        training_compliance,
                        84.0,
                        99.5,
                    ),
                    1,
                ),

            "contractor_headcount":
                int(
                    round(
                        _clamp(
                            contractor_headcount,
                            120,
                            240,
                        )
                    )
                ),
        })

    return data


# ============================================================
# High Performing / Normal Scenario
# ============================================================

def generate_high_performing_production_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return generate_production_demo(
        days=days
    )


def generate_high_performing_fleet_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return generate_fleet_demo(
        days=days
    )


def generate_high_performing_plant_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return generate_plant_demo(
        days=days
    )


def generate_high_performing_safety_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return generate_safety_demo(
        days=days
    )


def generate_high_performing_maintenance_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return generate_maintenance_demo(
        days=days
    )


def generate_high_performing_workforce_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    return generate_workforce_demo(
        days=days
    )


# ============================================================
# Fleet Breakdown Scenario
# ============================================================

def generate_fleet_breakdown_production_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:

    data = generate_production_demo(
        days=days
    )

    window = min(
        30,
        len(data),
    )

    start_index = len(data) - window

    for index in range(
        start_index,
        len(data),
    ):
        progress = (
            (index - start_index)
            / max(
                1,
                window - 1,
            )
        )

        degradation = _interpolate(
            1.00,
            0.90,
            progress,
        )

        item = data[index]

        item["ore_actual"] = int(
            item["ore_actual"]
            * degradation
        )

        item["waste_actual"] = int(
            item["waste_actual"]
            * degradation
        )

    return data


def generate_fleet_breakdown_fleet_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:

    data = generate_fleet_demo(
        days=days
    )

    if not data:
        return data

    latest_date = max(
        date.fromisoformat(
            item["report_date"]
        )
        for item in data
    )

    deterioration_start = (
        latest_date
        - timedelta(
            days=29
        )
    )

    for item in data:
        report_date = date.fromisoformat(
            item["report_date"]
        )

        if report_date < deterioration_start:
            continue

        progress = (
            (
                report_date
                - deterioration_start
            ).days
            / 29
        )

        item["availability"] = round(
            _clamp(
                item["availability"]
                * _interpolate(
                    1.00,
                    0.76,
                    progress,
                ),
                55,
                98,
            ),
            1,
        )

        item["utilization"] = round(
            _clamp(
                item["utilization"]
                * _interpolate(
                    1.00,
                    0.84,
                    progress,
                ),
                50,
                95,
            ),
            1,
        )

        item["breakdown_hours"] = round(
            _clamp(
                item["breakdown_hours"]
                + progress * 6.5,
                0,
                14,
            ),
            1,
        )

        item["idle_hours"] = round(
            _clamp(
                item["idle_hours"]
                + progress * 3.0,
                0,
                12,
            ),
            1,
        )

    return data


def generate_fleet_breakdown_plant_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Keep Plant reasonably healthy so Fleet remains the
    primary constraint.
    """

    data = generate_plant_demo(
        days=days
    )

    latest_records = data[
        -min(
            30,
            len(data),
        ):
    ]

    for item in latest_records:
        rng = _date_rng(
            date.fromisoformat(
                item["report_date"]
            ),
            300,
        )

        ratio = rng.uniform(
            0.95,
            1.01,
        )

        item["throughput_actual"] = int(
            item["throughput_plan"]
            * ratio
        )

        item["recovery"] = round(
            rng.uniform(
                89.3,
                91.5,
            ),
            1,
        )

        item["downtime_hours"] = round(
            rng.uniform(
                0.4,
                2.0,
            ),
            1,
        )

    return data


def generate_fleet_breakdown_safety_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:

    data = generate_safety_demo(
        days=days
    )

    latest_records = data[
        -min(
            30,
            len(data),
        ):
    ]

    for index, item in enumerate(
        latest_records
    ):
        item["hazards_reported"] += (
            index // 10
        )

        item["open_actions"] += (
            index // 8
        )

        item["recordable_incidents"] = 0

    return data


def generate_fleet_breakdown_maintenance_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:

    data = generate_maintenance_demo(
        days=days
    )

    latest_records = data[
        -min(
            30,
            len(data),
        ):
    ]

    count = len(latest_records)

    for index, item in enumerate(
        latest_records
    ):
        progress = (
            index
            / max(
                1,
                count - 1,
            )
        )

        item["pm_compliance"] = round(
            _interpolate(
                90.0,
                76.0,
                progress,
            ),
            1,
        )

        item["backlog_work_orders"] = int(
            round(
                _interpolate(
                    34,
                    78,
                    progress,
                )
            )
        )

        item["planned_work_percent"] = round(
            _interpolate(
                74,
                52,
                progress,
            ),
            1,
        )

        item["unplanned_work_percent"] = round(
            100
            - item[
                "planned_work_percent"
            ],
            1,
        )

        item["equipment_availability"] = round(
            _interpolate(
                90,
                69,
                progress,
            ),
            1,
        )

    return data


def generate_fleet_breakdown_workforce_demo(
    days: Optional[int] = None,
) -> List[Dict[str, Any]]:

    data = generate_workforce_demo(
        days=days
    )

    latest_records = data[
        -min(
            30,
            len(data),
        ):
    ]

    count = len(latest_records)

    for index, item in enumerate(
        latest_records
    ):
        progress = (
            index
            / max(
                1,
                count - 1,
            )
        )

        item["attendance_rate"] = round(
            _interpolate(
                95.5,
                92.0,
                progress,
            ),
            1,
        )

        item["overtime_hours"] = int(
            round(
                _interpolate(
                    120,
                    225,
                    progress,
                )
            )
        )

        item["fatigue_cases"] = (
            1
            if progress < 0.5
            else 2
        )

        item["training_compliance"] = round(
            _interpolate(
                96,
                91,
                progress,
            ),
            1,
        )

    return data


# ============================================================
# Other Scenario Adjustments
# ============================================================

def _apply_plant_bottleneck(
    plant: List[Dict[str, Any]],
    production: List[Dict[str, Any]],
) -> None:

    window = min(
        21,
        len(plant),
        len(production),
    )

    if window <= 0:
        return

    for index in range(window):
        progress = (
            index
            / max(
                1,
                window - 1,
            )
        )

        plant_item = plant[
            -window + index
        ]

        production_item = production[
            -window + index
        ]

        plant_item["throughput_actual"] = int(
            plant_item["throughput_plan"]
            * _interpolate(
                0.94,
                0.82,
                progress,
            )
        )

        plant_item["recovery"] = round(
            _interpolate(
                89.0,
                84.0,
                progress,
            ),
            1,
        )

        plant_item["downtime_hours"] = round(
            _interpolate(
                2.0,
                6.5,
                progress,
            ),
            1,
        )

        production_item["ore_actual"] = int(
            production_item["ore_plan"]
            * _interpolate(
                0.93,
                0.84,
                progress,
            )
        )


def _apply_safety_incident(
    safety: List[Dict[str, Any]],
) -> None:

    if len(safety) < 5:
        return

    incident_record = safety[-4]

    incident_record[
        "recordable_incidents"
    ] = 1

    incident_record[
        "near_misses"
    ] = max(
        2,
        incident_record[
            "near_misses"
        ],
    )

    incident_record[
        "critical_risks"
    ] = max(
        1,
        incident_record[
            "critical_risks"
        ],
    )

    incident_record[
        "open_actions"
    ] = max(
        10,
        incident_record[
            "open_actions"
        ],
    )


def _apply_weather_delay(
    production: List[Dict[str, Any]],
    fleet: List[Dict[str, Any]],
) -> None:

    if not production:
        return

    latest_date = date.fromisoformat(
        production[-1]["report_date"]
    )

    weather_start = (
        latest_date
        - timedelta(
            days=5
        )
    )

    for item in production:
        report_date = date.fromisoformat(
            item["report_date"]
        )

        if report_date >= weather_start:
            item["ore_actual"] = int(
                item["ore_actual"]
                * 0.87
            )

            item["waste_actual"] = int(
                item["waste_actual"]
                * 0.82
            )

    for item in fleet:
        report_date = date.fromisoformat(
            item["report_date"]
        )

        if report_date >= weather_start:
            item["utilization"] = round(
                _clamp(
                    item["utilization"]
                    * 0.88,
                    45,
                    95,
                ),
                1,
            )

            item["idle_hours"] = round(
                _clamp(
                    item["idle_hours"]
                    + 2.5,
                    0,
                    12,
                ),
                1,
            )


def _apply_winter_operations(
    production: List[Dict[str, Any]],
    plant: List[Dict[str, Any]],
    fleet: List[Dict[str, Any]],
) -> None:

    for item in production:
        report_date = date.fromisoformat(
            item["report_date"]
        )

        if report_date.month in {
            12,
            1,
            2,
        }:
            item["ore_actual"] = int(
                item["ore_actual"]
                * 0.97
            )

    for item in plant:
        report_date = date.fromisoformat(
            item["report_date"]
        )

        if report_date.month in {
            12,
            1,
            2,
        }:
            item[
                "throughput_actual"
            ] = int(
                item[
                    "throughput_actual"
                ]
                * 0.98
            )

    for item in fleet:
        report_date = date.fromisoformat(
            item["report_date"]
        )

        if report_date.month in {
            12,
            1,
            2,
        }:
            item["availability"] = round(
                _clamp(
                    item["availability"]
                    - 1.2,
                    55,
                    98,
                ),
                1,
            )


# ============================================================
# Dataset Quality Helpers
# ============================================================

def _calculate_average_attainment(
    records: List[Dict[str, Any]],
    plan_key: str,
    actual_key: str,
) -> float:

    total_plan = sum(
        float(
            item.get(
                plan_key,
                0,
            )
            or 0
        )
        for item in records
    )

    total_actual = sum(
        float(
            item.get(
                actual_key,
                0,
            )
            or 0
        )
        for item in records
    )

    if total_plan <= 0:
        return 0.0

    return round(
        (
            total_actual
            / total_plan
        )
        * 100,
        1,
    )


def _calculate_days_at_or_above_target(
    records: List[Dict[str, Any]],
    plan_key: str,
    actual_key: str,
) -> int:
    return sum(
        1
        for item in records
        if float(
            item.get(
                actual_key,
                0,
            )
            or 0
        )
        >= float(
            item.get(
                plan_key,
                0,
            )
            or 0
        )
    )


def _calculate_average(
    records: List[Dict[str, Any]],
    key: str,
) -> float:

    if not records:
        return 0.0

    values = [
        float(
            item.get(
                key,
                0,
            )
            or 0
        )
        for item in records
    ]

    return round(
        sum(values)
        / len(values),
        1,
    )


# ============================================================
# Main Demo Dataset Generator
# ============================================================

def generate_all_demo_data(
    scenario: str = DEFAULT_SCENARIO,
    mine_name: str = DEFAULT_MINE_NAME,
    days: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generate the complete Mine Manager AI synthetic dataset.

    Default timeline:
        2021-01-01 -> today

    Desired long-run performance:
        Production attainment       ≈ 95%
        Plant throughput attainment ≈ 95%

    All generated values are synthetic demonstration data.
    They are not Achit Ikht LLC historical operating data.
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
        normalized_scenario = (
            DEFAULT_SCENARIO
        )

    # --------------------------------------------------------
    # High Performing / Normal History
    # --------------------------------------------------------

    if (
        normalized_scenario
        == "High Performing Mine"
    ):
        production = (
            generate_high_performing_production_demo(
                days=normalized_days,
            )
        )

        fleet = (
            generate_high_performing_fleet_demo(
                days=normalized_days,
            )
        )

        plant = (
            generate_high_performing_plant_demo(
                days=normalized_days,
            )
        )

        safety = (
            generate_high_performing_safety_demo(
                days=normalized_days,
            )
        )

        maintenance = (
            generate_high_performing_maintenance_demo(
                days=normalized_days,
            )
        )

        workforce = (
            generate_high_performing_workforce_demo(
                days=normalized_days,
            )
        )

        scenario_status = (
            "historical_realistic"
        )

    # --------------------------------------------------------
    # Fleet Breakdown
    # --------------------------------------------------------

    elif (
        normalized_scenario
        == "Fleet Breakdown"
    ):
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
            "fleet_breakdown"
        )

    # --------------------------------------------------------
    # Other scenarios
    # --------------------------------------------------------

    else:
        production = generate_production_demo(
            days=normalized_days
        )

        fleet = generate_fleet_demo(
            days=normalized_days
        )

        plant = generate_plant_demo(
            days=normalized_days
        )

        safety = generate_safety_demo(
            days=normalized_days
        )

        maintenance = generate_maintenance_demo(
            days=normalized_days
        )

        workforce = generate_workforce_demo(
            days=normalized_days
        )

        if (
            normalized_scenario
            == "Plant Bottleneck"
        ):
            _apply_plant_bottleneck(
                plant,
                production,
            )

            scenario_status = (
                "plant_bottleneck"
            )

        elif (
            normalized_scenario
            == "Safety Incident"
        ):
            _apply_safety_incident(
                safety
            )

            scenario_status = (
                "safety_incident"
            )

        elif (
            normalized_scenario
            == "Heavy Rain / Weather Delay"
        ):
            _apply_weather_delay(
                production,
                fleet,
            )

            scenario_status = (
                "weather_delay"
            )

        elif (
            normalized_scenario
            == "Winter Operations"
        ):
            _apply_winter_operations(
                production,
                plant,
                fleet,
            )

            scenario_status = (
                "winter_operations"
            )

        else:
            scenario_status = (
                "generic_demo_data"
            )

    # --------------------------------------------------------
    # Long-Term Quality Metrics
    # --------------------------------------------------------

    production_attainment = (
        _calculate_average_attainment(
            production,
            "ore_plan",
            "ore_actual",
        )
    )

    plant_throughput_attainment = (
        _calculate_average_attainment(
            plant,
            "throughput_plan",
            "throughput_actual",
        )
    )

    # --------------------------------------------------------
    # Latest 30-Day Quality Metrics
    # --------------------------------------------------------

    production_30d = production[
        -min(
            30,
            len(production),
        ):
    ]

    plant_30d = plant[
        -min(
            30,
            len(plant),
        ):
    ]

    production_30d_attainment = (
        _calculate_average_attainment(
            production_30d,
            "ore_plan",
            "ore_actual",
        )
    )

    plant_30d_attainment = (
        _calculate_average_attainment(
            plant_30d,
            "throughput_plan",
            "throughput_actual",
        )
    )

    production_30d_days_at_target = (
        _calculate_days_at_or_above_target(
            production_30d,
            "ore_plan",
            "ore_actual",
        )
    )

    plant_30d_days_at_target = (
        _calculate_days_at_or_above_target(
            plant_30d,
            "throughput_plan",
            "throughput_actual",
        )
    )

    plant_30d_recovery = (
        _calculate_average(
            plant_30d,
            "recovery",
        )
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "scenario":
            normalized_scenario,

        "scenario_status":
            scenario_status,

        "mine_name":
            normalized_mine_name,

        "historical_start_date":
            (
                production[0][
                    "report_date"
                ]
                if production
                else None
            ),

        "historical_end_date":
            (
                production[-1][
                    "report_date"
                ]
                if production
                else None
            ),

        "reporting_days":
            normalized_days,

        "synthetic_data":
            True,

        "synthetic_targets": {
            "production_attainment_percent":
                95.0,

            "plant_throughput_attainment_percent":
                95.0,
        },

        "generated_performance": {
            "production_attainment_percent":
                production_attainment,

            "plant_throughput_attainment_percent":
                plant_throughput_attainment,
        },

        "latest_30_day_performance": {
            "production_attainment_percent":
                production_30d_attainment,

            "plant_throughput_attainment_percent":
                plant_30d_attainment,

            "plant_recovery_percent":
                plant_30d_recovery,

            "production_days_at_or_above_target":
                production_30d_days_at_target,

            "plant_days_at_or_above_target":
                plant_30d_days_at_target,

            "period_days":
                len(production_30d),
        },

        "production":
            production,

        "fleet":
            fleet,

        "plant":
            plant,

        "safety":
            safety,

        "maintenance":
            maintenance,

        "workforce":
            workforce,
    }