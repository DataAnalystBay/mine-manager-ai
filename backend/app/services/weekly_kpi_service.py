from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


def get_weekly_kpi_summary(
    db: Session,
    mine_name: str,
    days: int = 7,
) -> dict:
    """
    Return live KPI history and aggregated weekly metrics
    for the latest available reporting days.
    """

    normalized_mine_name = (
        mine_name.strip()
        if mine_name
        else "Oyu Tolgoi Surface"
    )

    # --------------------------------------------------
    # Production
    # --------------------------------------------------

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
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": normalized_mine_name,
            "days": days,
        },
    ).mappings().all()

    if not production_rows:
        return {
            "mine_name": normalized_mine_name,
            "report_date": None,
            "status": "No production data",
            "days": [],
        }

    production_rows = list(
        reversed(production_rows)
    )

    # --------------------------------------------------
    # Fleet
    # --------------------------------------------------

    fleet_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                availability,
                utilization
            FROM fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": normalized_mine_name,
            "days": days,
        },
    ).mappings().all()

    fleet_rows = list(
        reversed(fleet_rows)
    )

    # --------------------------------------------------
    # Plant
    # --------------------------------------------------

    plant_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_plan,
                throughput_actual,
                recovery
            FROM plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": normalized_mine_name,
            "days": days,
        },
    ).mappings().all()

    plant_rows = list(
        reversed(plant_rows)
    )

    # --------------------------------------------------
    # Safety
    # --------------------------------------------------

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
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        {
            "mine_name": normalized_mine_name,
            "days": days,
        },
    ).mappings().all()

    safety_rows = list(
        reversed(safety_rows)
    )

    # --------------------------------------------------
    # Index secondary datasets by report date
    # --------------------------------------------------

    fleet_by_date = {
        str(row["report_date"]): row
        for row in fleet_rows
    }

    plant_by_date = {
        str(row["report_date"]): row
        for row in plant_rows
    }

    safety_by_date = {
        str(row["report_date"]): row
        for row in safety_rows
    }

    daily_results = []

    for production in production_rows:
        report_date = str(
            production["report_date"]
        )

        ore = safe_percentage(
            production["ore_actual"],
            production["ore_plan"],
        )

        waste = safe_percentage(
            production["waste_actual"],
            production["waste_plan"],
        )

        # ----------------------------------------------
        # Fleet
        # ----------------------------------------------

        fleet_row = fleet_by_date.get(
            report_date
        )

        if fleet_row:
            availability = float(
                fleet_row["availability"] or 0
            )

            utilization = float(
                fleet_row["utilization"] or 0
            )

            fleet = calculate_fleet_score(
                availability,
                utilization,
            )
        else:
            availability = 0
            utilization = 0
            fleet = 0

        # ----------------------------------------------
        # Plant
        # ----------------------------------------------

        plant_row = plant_by_date.get(
            report_date
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

        # ----------------------------------------------
        # Safety
        # ----------------------------------------------

        safety_row = safety_by_date.get(
            report_date
        )

        if safety_row:
            incidents = int(
                safety_row[
                    "incidents"
                ] or 0
            )

            near_misses = int(
                safety_row[
                    "near_misses"
                ] or 0
            )

            critical_risks = int(
                safety_row[
                    "critical_risks"
                ] or 0
            )

            safety_score = float(
                safety_row[
                    "safety_score"
                ] or 0
            )
        else:
            incidents = 0
            near_misses = 0
            critical_risks = 0
            safety_score = 0

        # ----------------------------------------------
        # Mine Health
        # ----------------------------------------------

        health = calculate_health_score(
            ore=ore,
            waste=waste,
            fleet=fleet,
            plant=plant,
            safety_score=safety_score,
        )

        daily_results.append(
            {
                "report_date": report_date,
                "ore": ore,
                "waste": waste,
                "fleet": fleet,
                "availability": availability,
                "utilization": utilization,
                "plant": plant,
                "throughput": throughput,
                "recovery": recovery,
                "safety": incidents,
                "safety_score": safety_score,
                "near_misses": near_misses,
                "critical_risks": critical_risks,
                "health": health,
            }
        )

    # --------------------------------------------------
    # Weekly averages / totals
    # --------------------------------------------------

    count = len(daily_results)

    def average(key: str) -> float:
        if count == 0:
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
                for item in daily_results
            )
            / count,
            1,
        )

    weekly_health = average(
        "health"
    )

    weekly_ore = average(
        "ore"
    )

    weekly_waste = average(
        "waste"
    )

    weekly_fleet = average(
        "fleet"
    )

    weekly_availability = average(
        "availability"
    )

    weekly_utilization = average(
        "utilization"
    )

    weekly_plant = average(
        "plant"
    )

    weekly_throughput = average(
        "throughput"
    )

    weekly_recovery = average(
        "recovery"
    )

    weekly_safety_score = average(
        "safety_score"
    )

    total_incidents = sum(
        int(
            item["safety"]
        )
        for item in daily_results
    )

    total_near_misses = sum(
        int(
            item["near_misses"]
        )
        for item in daily_results
    )

    total_critical_risks = sum(
        int(
            item["critical_risks"]
        )
        for item in daily_results
    )

    return {
        "mine_name": normalized_mine_name,
        "report_date": (
            daily_results[-1][
                "report_date"
            ]
        ),
        "period_start": (
            daily_results[0][
                "report_date"
            ]
        ),
        "period_end": (
            daily_results[-1][
                "report_date"
            ]
        ),
        "health": weekly_health,
        "ore": weekly_ore,
        "waste": weekly_waste,
        "fleet": weekly_fleet,
        "availability": weekly_availability,
        "utilization": weekly_utilization,
        "plant": weekly_plant,
        "throughput": weekly_throughput,
        "recovery": weekly_recovery,
        "safety": total_incidents,
        "safety_score": weekly_safety_score,
        "near_misses": total_near_misses,
        "critical_risks": total_critical_risks,
        "days": daily_results,
        "status": "Connected to PostgreSQL",
    }