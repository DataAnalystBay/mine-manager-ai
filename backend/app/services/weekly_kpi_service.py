from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


# ============================================================
# Operation profile helpers
# ============================================================

SXEW_OPERATION_PROFILES = {
    "sxew",
    "sxew_copper",
    "sx_ew",
    "copper_cathode",
    "cathode",
}


def _normalize_operation_profile(
    operation_profile: str,
) -> str:
    """
    Normalize the tenant operation profile into a stable
    lowercase internal value.
    """

    return (
        str(
            operation_profile
            or "standard_mine"
        )
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def _is_sxew_operation(
    operation_profile: str,
) -> bool:
    """
    Return True when the active tenant is an SX-EW /
    copper cathode operation.
    """

    return (
        _normalize_operation_profile(
            operation_profile
        )
        in SXEW_OPERATION_PROFILES
    )


def _average(
    rows: list[dict[str, Any]],
    key: str,
) -> float:
    """
    Return the rounded average for a KPI key.
    """

    if not rows:
        return 0

    return round(
        sum(
            float(
                item.get(
                    key,
                    0,
                )
                or 0
            )
            for item in rows
        )
        / len(rows),
        1,
    )


def _calculate_sxew_health_score(
    ore: float,
    plant: float,
    safety_score: float,
) -> float:
    """
    Calculate executive health for an SX-EW copper operation.

    Waste movement and fleet KPIs are intentionally excluded
    because they are not part of the active SX-EW executive
    operating model.

    Current V1.0 SX-EW health dimensions:

        - Cathode Production
        - Plant Performance
        - Safety

    This prevents non-applicable KPIs from being interpreted
    as zero-performance KPIs.
    """

    applicable_scores = [
        float(ore or 0),
        float(plant or 0),
        float(safety_score or 0),
    ]

    if not applicable_scores:
        return 0

    return round(
        sum(applicable_scores)
        / len(applicable_scores),
        1,
    )


# ============================================================
# Empty response
# ============================================================

def empty_weekly_kpi_summary(
    company_id: int,
    mine_id: int,
    mine_name: str,
    operation_profile: str = "standard_mine",
) -> dict:
    """
    Return an empty tenant-aware weekly KPI response.
    """

    normalized_operation_profile = (
        _normalize_operation_profile(
            operation_profile
        )
    )

    is_sxew = _is_sxew_operation(
        normalized_operation_profile
    )

    return {
        "company_id": int(company_id),
        "mine_id": int(mine_id),
        "mine_name": mine_name,
        "operation_profile":
            normalized_operation_profile,
        "report_date": None,
        "period_start": None,
        "period_end": None,
        "health": 0,
        "ore": 0,
        "waste": 0,
        "fleet": 0,
        "availability": 0,
        "utilization": 0,
        "plant": 0,
        "throughput": 0,
        "recovery": 0,
        "safety": 0,
        "safety_score": 0,
        "near_misses": 0,
        "critical_risks": 0,
        "production_label": (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        ),
        "waste_applicable": not is_sxew,
        "fleet_applicable": not is_sxew,
        "days": [],
        "status": "No production data",
    }


# ============================================================
# Weekly KPI summary
# ============================================================

def get_weekly_kpi_summary(
    db: Session,
    company_id: int,
    mine_id: int,
    mine_name: str,
    operation_profile: str = "standard_mine",
    days: int = 7,
) -> dict:
    """
    Return live tenant-aware KPI history and aggregated
    weekly metrics for the latest available reporting days.

    Tenant ownership is determined by:

        company_id + mine_id

    mine_name is retained for display/context only.

    Operation profiles allow the same SaaS reporting service
    to support materially different mining operations.

    Standard mine:
        - Ore production
        - Waste movement
        - Fleet
        - Plant
        - Safety

    SX-EW copper operation:
        - Cathode production
        - Plant
        - Safety
        - Waste not applicable
        - Fleet not applicable
    """

    if company_id is None:
        raise ValueError(
            "company_id is required"
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required"
        )

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

    if not normalized_mine_name:
        raise ValueError(
            "mine_name is required"
        )

    normalized_operation_profile = (
        _normalize_operation_profile(
            operation_profile
        )
    )

    is_sxew = _is_sxew_operation(
        normalized_operation_profile
    )

    try:
        normalized_days = int(days)
    except (TypeError, ValueError):
        normalized_days = 7

    normalized_days = max(
        1,
        min(
            normalized_days,
            90,
        ),
    )

    query_params = {
        "company_id": int(company_id),
        "mine_id": int(mine_id),
        "days": normalized_days,
    }

    # --------------------------------------------------------
    # Production
    # --------------------------------------------------------

    production_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                ore_plan,
                ore_actual,
                waste_plan,
                waste_actual
            FROM production_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        query_params,
    ).mappings().all()

    if not production_rows:
        return empty_weekly_kpi_summary(
            company_id=int(company_id),
            mine_id=int(mine_id),
            mine_name=normalized_mine_name,
            operation_profile=(
                normalized_operation_profile
            ),
        )

    production_rows = list(
        reversed(
            production_rows
        )
    )

    # --------------------------------------------------------
    # Fleet
    #
    # Fleet is intentionally not queried for an SX-EW
    # operation because it is not part of the active
    # executive KPI model for that operation profile.
    # --------------------------------------------------------

    if is_sxew:
        fleet_rows = []

    else:
        fleet_rows = db.execute(
            text(
                """
                SELECT
                    report_date,
                    availability,
                    utilization
                FROM fleet_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT :days
                """
            ),
            query_params,
        ).mappings().all()

        fleet_rows = list(
            reversed(
                fleet_rows
            )
        )

    # --------------------------------------------------------
    # Plant
    # --------------------------------------------------------

    plant_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_plan,
                throughput_actual,
                recovery
            FROM plant_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        query_params,
    ).mappings().all()

    plant_rows = list(
        reversed(
            plant_rows
        )
    )

    # --------------------------------------------------------
    # Safety
    # --------------------------------------------------------

    safety_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM safety_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        query_params,
    ).mappings().all()

    safety_rows = list(
        reversed(
            safety_rows
        )
    )

    # --------------------------------------------------------
    # Index secondary datasets by reporting date
    # --------------------------------------------------------

    fleet_by_date = {
        str(
            row["report_date"]
        ): row
        for row in fleet_rows
    }

    plant_by_date = {
        str(
            row["report_date"]
        ): row
        for row in plant_rows
    }

    safety_by_date = {
        str(
            row["report_date"]
        ): row
        for row in safety_rows
    }

    # --------------------------------------------------------
    # Daily KPI calculations
    # --------------------------------------------------------

    daily_results: list[
        dict[str, Any]
    ] = []

    for production in production_rows:
        report_date = str(
            production[
                "report_date"
            ]
        )

        # ----------------------------------------------------
        # Production
        # ----------------------------------------------------

        ore = safe_percentage(
            production[
                "ore_actual"
            ],
            production[
                "ore_plan"
            ],
        )

        if is_sxew:
            waste = 0

        else:
            waste = safe_percentage(
                production[
                    "waste_actual"
                ],
                production[
                    "waste_plan"
                ],
            )

        # ----------------------------------------------------
        # Fleet
        # ----------------------------------------------------

        if is_sxew:
            availability = 0
            utilization = 0
            fleet = 0

        else:
            fleet_row = (
                fleet_by_date.get(
                    report_date
                )
            )

            if fleet_row:
                availability = float(
                    fleet_row[
                        "availability"
                    ]
                    or 0
                )

                utilization = float(
                    fleet_row[
                        "utilization"
                    ]
                    or 0
                )

                fleet = (
                    calculate_fleet_score(
                        availability,
                        utilization,
                    )
                )

            else:
                availability = 0
                utilization = 0
                fleet = 0

        # ----------------------------------------------------
        # Plant
        # ----------------------------------------------------

        plant_row = (
            plant_by_date.get(
                report_date
            )
        )

        if plant_row:
            (
                plant,
                throughput,
                recovery,
            ) = calculate_plant_score(
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

        else:
            plant = 0
            throughput = 0
            recovery = 0

        # ----------------------------------------------------
        # Safety
        # ----------------------------------------------------

        safety_row = (
            safety_by_date.get(
                report_date
            )
        )

        if safety_row:
            incidents = int(
                safety_row[
                    "incidents"
                ]
                or 0
            )

            near_misses = int(
                safety_row[
                    "near_misses"
                ]
                or 0
            )

            critical_risks = int(
                safety_row[
                    "critical_risks"
                ]
                or 0
            )

            safety_score = float(
                safety_row[
                    "safety_score"
                ]
                or 0
            )

        else:
            incidents = 0
            near_misses = 0
            critical_risks = 0
            safety_score = 0

        # ----------------------------------------------------
        # Mine Health
        #
        # Standard mine:
        #     Production + Waste + Fleet + Plant + Safety
        #
        # SX-EW:
        #     Cathode Production + Plant + Safety
        #
        # Waste and fleet must NOT penalize an SX-EW tenant
        # because they are not part of its active executive
        # KPI model.
        # ----------------------------------------------------

        if is_sxew:
            health = (
                _calculate_sxew_health_score(
                    ore=ore,
                    plant=plant,
                    safety_score=safety_score,
                )
            )

        else:
            health = calculate_health_score(
                ore=ore,
                waste=waste,
                fleet=fleet,
                plant=plant,
                safety_score=safety_score,
            )

        daily_results.append(
            {
                "report_date":
                    report_date,

                "ore":
                    ore,

                "waste":
                    waste,

                "fleet":
                    fleet,

                "availability":
                    availability,

                "utilization":
                    utilization,

                "plant":
                    plant,

                "throughput":
                    throughput,

                "recovery":
                    recovery,

                "safety":
                    incidents,

                "safety_score":
                    safety_score,

                "near_misses":
                    near_misses,

                "critical_risks":
                    critical_risks,

                "health":
                    health,

                "production_label": (
                    "Cathode Production"
                    if is_sxew
                    else "Ore Production"
                ),

                "waste_applicable":
                    not is_sxew,

                "fleet_applicable":
                    not is_sxew,
            }
        )

    # --------------------------------------------------------
    # Weekly averages / totals
    # --------------------------------------------------------

    weekly_health = _average(
        daily_results,
        "health",
    )

    weekly_ore = _average(
        daily_results,
        "ore",
    )

    if is_sxew:
        weekly_waste = 0
        weekly_fleet = 0
        weekly_availability = 0
        weekly_utilization = 0

    else:
        weekly_waste = _average(
            daily_results,
            "waste",
        )

        weekly_fleet = _average(
            daily_results,
            "fleet",
        )

        weekly_availability = _average(
            daily_results,
            "availability",
        )

        weekly_utilization = _average(
            daily_results,
            "utilization",
        )

    weekly_plant = _average(
        daily_results,
        "plant",
    )

    weekly_throughput = _average(
        daily_results,
        "throughput",
    )

    weekly_recovery = _average(
        daily_results,
        "recovery",
    )

    weekly_safety_score = _average(
        daily_results,
        "safety_score",
    )

    total_incidents = sum(
        int(
            item[
                "safety"
            ]
        )
        for item in daily_results
    )

    total_near_misses = sum(
        int(
            item[
                "near_misses"
            ]
        )
        for item in daily_results
    )

    total_critical_risks = sum(
        int(
            item[
                "critical_risks"
            ]
        )
        for item in daily_results
    )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "company_id":
            int(company_id),

        "mine_id":
            int(mine_id),

        "mine_name":
            normalized_mine_name,

        "operation_profile":
            normalized_operation_profile,

        "report_date":
            daily_results[-1][
                "report_date"
            ],

        "period_start":
            daily_results[0][
                "report_date"
            ],

        "period_end":
            daily_results[-1][
                "report_date"
            ],

        "health":
            weekly_health,

        "ore":
            weekly_ore,

        "waste":
            weekly_waste,

        "fleet":
            weekly_fleet,

        "availability":
            weekly_availability,

        "utilization":
            weekly_utilization,

        "plant":
            weekly_plant,

        "throughput":
            weekly_throughput,

        "recovery":
            weekly_recovery,

        "safety":
            total_incidents,

        "safety_score":
            weekly_safety_score,

        "near_misses":
            total_near_misses,

        "critical_risks":
            total_critical_risks,

        "production_label": (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        ),

        "waste_applicable":
            not is_sxew,

        "fleet_applicable":
            not is_sxew,

        "days":
            daily_results,

        "status":
            "Connected to PostgreSQL",
    }