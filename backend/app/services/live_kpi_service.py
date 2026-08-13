from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


def empty_live_kpi_summary(
    mine_name: str,
) -> dict:
    return {
        "mine_name": mine_name,
        "report_date": None,
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
        "status": "No production data",
    }


def get_live_kpi_summary(
    db: Session,
    mine_name: str,
) -> dict:
    normalized_mine_name = (
        mine_name.strip()
        if mine_name
        else "Oyu Tolgoi Surface"
    )

    # --------------------------------------------------
    # Production
    # --------------------------------------------------

    production = db.execute(
        text(
            """
            SELECT *
            FROM production_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {
            "mine_name": normalized_mine_name,
        },
    ).mappings().first()

    if production is None:
        return empty_live_kpi_summary(
            normalized_mine_name
        )

    ore = safe_percentage(
        production["ore_actual"],
        production["ore_plan"],
    )

    waste = safe_percentage(
        production["waste_actual"],
        production["waste_plan"],
    )

    # --------------------------------------------------
    # Fleet
    # --------------------------------------------------

    fleet_result = db.execute(
        text(
            """
            SELECT *
            FROM fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {
            "mine_name": normalized_mine_name,
        },
    ).mappings().first()

    if fleet_result:
        availability = float(
            fleet_result["availability"] or 0
        )

        utilization = float(
            fleet_result["utilization"] or 0
        )

        fleet = calculate_fleet_score(
            availability,
            utilization,
        )
    else:
        availability = 0
        utilization = 0
        fleet = 0

    # --------------------------------------------------
    # Plant
    # --------------------------------------------------

    plant_result = db.execute(
        text(
            """
            SELECT *
            FROM plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {
            "mine_name": normalized_mine_name,
        },
    ).mappings().first()

    if plant_result:
        plant, throughput, recovery = (
            calculate_plant_score(
                plant_result[
                    "throughput_actual"
                ],
                plant_result[
                    "throughput_plan"
                ],
                plant_result[
                    "recovery"
                ],
            )
        )
    else:
        plant = 0
        throughput = 0
        recovery = 0

    # --------------------------------------------------
    # Safety
    # --------------------------------------------------

    safety_result = db.execute(
        text(
            """
            SELECT *
            FROM safety_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        ),
        {
            "mine_name": normalized_mine_name,
        },
    ).mappings().first()

    if safety_result:
        incidents = int(
            safety_result["incidents"] or 0
        )

        near_misses = int(
            safety_result["near_misses"] or 0
        )

        critical_risks = int(
            safety_result["critical_risks"] or 0
        )

        safety_score = float(
            safety_result["safety_score"] or 0
        )
    else:
        incidents = 0
        near_misses = 0
        critical_risks = 0
        safety_score = 0

    # --------------------------------------------------
    # Mine Health
    # --------------------------------------------------

    health = calculate_health_score(
        ore=ore,
        waste=waste,
        fleet=fleet,
        plant=plant,
        safety_score=safety_score,
    )

    return {
        "mine_name": normalized_mine_name,
        "report_date": str(
            production["report_date"]
        ),
        "health": health,
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
        "status": "Connected to PostgreSQL",
    }