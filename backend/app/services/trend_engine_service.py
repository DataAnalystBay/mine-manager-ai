from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


def get_health_history_service(
    mine_name: str,
    db: Session
):
    rows = db.execute(text("""
        SELECT
            p.report_date,
            p.ore_plan,
            p.ore_actual,
            p.waste_plan,
            p.waste_actual,
            f.availability,
            f.utilization,
            pl.throughput_plan,
            pl.throughput_actual,
            pl.recovery,
            s.safety_score
        FROM production_daily p
        LEFT JOIN fleet_daily f
            ON p.report_date = f.report_date
            AND p.mine_name = f.mine_name
        LEFT JOIN plant_daily pl
            ON p.report_date = pl.report_date
            AND p.mine_name = pl.mine_name
        LEFT JOIN safety_daily s
            ON p.report_date = s.report_date
            AND p.mine_name = s.mine_name
        WHERE p.mine_name = :mine_name
        ORDER BY p.report_date ASC
    """), {"mine_name": mine_name}).mappings().all()

    history = []

    for row in rows:
        ore = safe_percentage(row["ore_actual"], row["ore_plan"])
        waste = safe_percentage(row["waste_actual"], row["waste_plan"])

        fleet = calculate_fleet_score(
            row["availability"],
            row["utilization"]
        )

        plant, throughput, recovery = calculate_plant_score(
            row["throughput_actual"],
            row["throughput_plan"],
            row["recovery"]
        )

        safety_score = float(row["safety_score"] or 0)

        health = calculate_health_score(
            ore=ore,
            waste=waste,
            fleet=fleet,
            plant=plant,
            safety_score=safety_score
        )

        history.append({
            "report_date": str(row["report_date"]),
            "health": health,
            "ore": ore,
            "waste": waste,
            "fleet": fleet,
            "plant": plant,
            "throughput": throughput,
            "recovery": recovery,
            "safety_score": safety_score
        })

    return {
        "mine_name": mine_name,
        "history": history,
        "status": "Health history generated from PostgreSQL"
    }


def get_trend_analysis_service(
    mine_name: str,
    db: Session
):
    result = get_health_history_service(mine_name, db)
    history = result.get("history", [])

    if len(history) < 2:
        return {
            "mine_name": mine_name,
            "direction": "No Data",
            "change_percent": 0,
            "summary": "Not enough historical data available to calculate a trend.",
            "drivers": [],
            "recommendations": [],
            "status": "Not enough data"
        }

    first = history[0]
    latest = history[-1]

    first_health = float(first["health"] or 0)
    latest_health = float(latest["health"] or 0)

    change_percent = round(latest_health - first_health, 1)

    if change_percent > 2:
        direction = "Improving"
    elif change_percent < -2:
        direction = "Declining"
    else:
        direction = "Stable"

    drivers = []
    recommendations = []

    def metric_change(metric_name):
        return round(
            float(latest.get(metric_name, 0) or 0) -
            float(first.get(metric_name, 0) or 0),
            1
        )

    ore_change = metric_change("ore")
    waste_change = metric_change("waste")
    fleet_change = metric_change("fleet")
    plant_change = metric_change("plant")
    safety_change = metric_change("safety_score")

    if fleet_change > 2:
        drivers.append(f"Fleet performance improved by {fleet_change} percentage points.")
    elif fleet_change < -2:
        drivers.append(f"Fleet performance declined by {abs(fleet_change)} percentage points.")
        recommendations.append("Review fleet availability, utilization, maintenance delays, and dispatch efficiency.")

    if plant_change > 2:
        drivers.append(f"Plant performance improved by {plant_change} percentage points.")
    elif plant_change < -2:
        drivers.append(f"Plant performance declined by {abs(plant_change)} percentage points.")
        recommendations.append("Review throughput bottlenecks, recovery performance, and plant downtime causes.")

    if ore_change > 2:
        drivers.append(f"Ore performance improved by {ore_change} percentage points.")
    elif ore_change < -2:
        drivers.append(f"Ore performance declined by {abs(ore_change)} percentage points.")
        recommendations.append("Review mining sequence, shovel allocation, and ore delivery constraints.")

    if waste_change > 2:
        drivers.append(f"Waste movement improved by {waste_change} percentage points.")
    elif waste_change < -2:
        drivers.append(f"Waste movement declined by {abs(waste_change)} percentage points.")
        recommendations.append("Check truck allocation, haul road delays, and waste dump constraints.")

    if safety_change > 2:
        drivers.append(f"Safety score improved by {safety_change} percentage points.")
    elif safety_change < -2:
        drivers.append(f"Safety score declined by {abs(safety_change)} percentage points.")
        recommendations.append("Review safety incidents, near misses, and critical risk controls.")

    if not drivers:
        drivers.append("No major KPI movement detected across the available reporting period.")

    if not recommendations:
        recommendations.append("Maintain current operating rhythm and continue monitoring leading indicators.")

    summary = (
        f"Mine Health is {direction.lower()} over the available reporting period. "
        f"The score changed from {first_health}% to {latest_health}%, "
        f"a movement of {change_percent} percentage points."
    )

    return {
        "mine_name": mine_name,
        "start_date": first["report_date"],
        "end_date": latest["report_date"],
        "direction": direction,
        "change_percent": change_percent,
        "summary": summary,
        "drivers": drivers,
        "recommendations": recommendations,
        "status": "Trend analysis generated from health history"
    }