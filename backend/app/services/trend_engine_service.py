from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


def _normalize_language(language: str) -> str:
    """
    Normalize language values to supported codes.
    Defaults safely to English.
    """
    if not language:
        return "en"

    language = str(language).strip().lower()

    if language in {"mn", "mon", "mongolian", "монгол"}:
        return "mn"

    return "en"


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
        ore = safe_percentage(
            row["ore_actual"],
            row["ore_plan"],
        )

        waste = safe_percentage(
            row["waste_actual"],
            row["waste_plan"],
        )

        fleet = calculate_fleet_score(
            row["availability"],
            row["utilization"],
        )

        plant, throughput, recovery = calculate_plant_score(
            row["throughput_actual"],
            row["throughput_plan"],
            row["recovery"],
        )

        safety_score = float(
            row["safety_score"] or 0
        )

        health = calculate_health_score(
            ore=ore,
            waste=waste,
            fleet=fleet,
            plant=plant,
            safety_score=safety_score,
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
            "safety_score": safety_score,
        })

    return {
        "mine_name": mine_name,
        "history": history,
        "status": "Health history generated from PostgreSQL",
    }


def get_trend_analysis_service(
    mine_name: str,
    db: Session,
    language: str = "en",
):
    """
    Generate Mine Health trend analysis.

    Supported languages:
    - en: English
    - mn: Mongolian
    """

    language = _normalize_language(language)

    result = get_health_history_service(
        mine_name,
        db,
    )

    history = result.get("history", [])

    # ---------------------------------------------------------
    # NOT ENOUGH DATA
    # ---------------------------------------------------------

    if len(history) < 2:
        if language == "mn":
            return {
                "mine_name": mine_name,
                "direction": "Өгөгдөл байхгүй",
                "direction_code": "no_data",
                "change_percent": 0,
                "summary": (
                    "Чиг хандлагыг тооцоолоход хангалттай "
                    "түүхэн өгөгдөл байхгүй байна."
                ),
                "drivers": [],
                "recommendations": [],
                "status": "Өгөгдөл хангалтгүй",
            }

        return {
            "mine_name": mine_name,
            "direction": "No Data",
            "direction_code": "no_data",
            "change_percent": 0,
            "summary": (
                "Not enough historical data available "
                "to calculate a trend."
            ),
            "drivers": [],
            "recommendations": [],
            "status": "Not enough data",
        }

    first = history[0]
    latest = history[-1]

    first_health = float(
        first["health"] or 0
    )

    latest_health = float(
        latest["health"] or 0
    )

    change_percent = round(
        latest_health - first_health,
        1,
    )

    # ---------------------------------------------------------
    # TREND DIRECTION
    # ---------------------------------------------------------

    if change_percent > 2:
        direction_code = "improving"
    elif change_percent < -2:
        direction_code = "declining"
    else:
        direction_code = "stable"

    if language == "mn":
        direction_map = {
            "improving": "Сайжирч байна",
            "declining": "Буурч байна",
            "stable": "Тогтвортой",
        }
    else:
        direction_map = {
            "improving": "Improving",
            "declining": "Declining",
            "stable": "Stable",
        }

    direction = direction_map[direction_code]

    drivers = []
    recommendations = []

    # ---------------------------------------------------------
    # KPI CHANGE HELPER
    # ---------------------------------------------------------

    def metric_change(metric_name):
        return round(
            float(
                latest.get(metric_name, 0) or 0
            )
            -
            float(
                first.get(metric_name, 0) or 0
            ),
            1,
        )

    ore_change = metric_change("ore")
    waste_change = metric_change("waste")
    fleet_change = metric_change("fleet")
    plant_change = metric_change("plant")
    safety_change = metric_change(
        "safety_score"
    )

    # ---------------------------------------------------------
    # FLEET
    # ---------------------------------------------------------

    if fleet_change > 2:
        if language == "mn":
            drivers.append(
                f"Флотын гүйцэтгэл "
                f"{fleet_change} нэгж хувиар сайжирсан."
            )
        else:
            drivers.append(
                f"Fleet performance improved by "
                f"{fleet_change} percentage points."
            )

    elif fleet_change < -2:
        if language == "mn":
            drivers.append(
                f"Флотын гүйцэтгэл "
                f"{abs(fleet_change)} нэгж хувиар буурсан."
            )

            recommendations.append(
                "Флотын бэлэн байдал, ашиглалт, "
                "засвар үйлчилгээний саатал болон "
                "диспетчерийн үр ашгийг шалгана уу."
            )

        else:
            drivers.append(
                f"Fleet performance declined by "
                f"{abs(fleet_change)} percentage points."
            )

            recommendations.append(
                "Review fleet availability, utilization, "
                "maintenance delays, and dispatch efficiency."
            )

    # ---------------------------------------------------------
    # PLANT
    # ---------------------------------------------------------

    if plant_change > 2:
        if language == "mn":
            drivers.append(
                f"Баяжуулах үйлдвэрийн гүйцэтгэл "
                f"{plant_change} нэгж хувиар сайжирсан."
            )
        else:
            drivers.append(
                f"Plant performance improved by "
                f"{plant_change} percentage points."
            )

    elif plant_change < -2:
        if language == "mn":
            drivers.append(
                f"Баяжуулах үйлдвэрийн гүйцэтгэл "
                f"{abs(plant_change)} нэгж хувиар буурсан."
            )

            recommendations.append(
                "Боловсруулалтын хүчин чадлын хязгаарлалт, "
                "металл авалт болон үйлдвэрийн зогсолтын "
                "шалтгааныг шалгана уу."
            )

        else:
            drivers.append(
                f"Plant performance declined by "
                f"{abs(plant_change)} percentage points."
            )

            recommendations.append(
                "Review throughput bottlenecks, "
                "recovery performance, and plant downtime causes."
            )

    # ---------------------------------------------------------
    # ORE
    # ---------------------------------------------------------

    if ore_change > 2:
        if language == "mn":
            drivers.append(
                f"Хүдрийн гүйцэтгэл "
                f"{ore_change} нэгж хувиар сайжирсан."
            )
        else:
            drivers.append(
                f"Ore performance improved by "
                f"{ore_change} percentage points."
            )

    elif ore_change < -2:
        if language == "mn":
            drivers.append(
                f"Хүдрийн гүйцэтгэл "
                f"{abs(ore_change)} нэгж хувиар буурсан."
            )

            recommendations.append(
                "Олборлолтын дараалал, экскаваторын "
                "хуваарилалт болон хүдэр нийлүүлэлтийн "
                "хязгаарлалтыг шалгана уу."
            )

        else:
            drivers.append(
                f"Ore performance declined by "
                f"{abs(ore_change)} percentage points."
            )

            recommendations.append(
                "Review mining sequence, shovel allocation, "
                "and ore delivery constraints."
            )

    # ---------------------------------------------------------
    # WASTE
    # ---------------------------------------------------------

    if waste_change > 2:
        if language == "mn":
            drivers.append(
                f"Хөрс хуулалтын гүйцэтгэл "
                f"{waste_change} нэгж хувиар сайжирсан."
            )
        else:
            drivers.append(
                f"Waste movement improved by "
                f"{waste_change} percentage points."
            )

    elif waste_change < -2:
        if language == "mn":
            drivers.append(
                f"Хөрс хуулалтын гүйцэтгэл "
                f"{abs(waste_change)} нэгж хувиар буурсан."
            )

            recommendations.append(
                "Автосамосвалын хуваарилалт, "
                "тээврийн замын саатал болон "
                "хөрсний овоолгын хязгаарлалтыг шалгана уу."
            )

        else:
            drivers.append(
                f"Waste movement declined by "
                f"{abs(waste_change)} percentage points."
            )

            recommendations.append(
                "Check truck allocation, haul road delays, "
                "and waste dump constraints."
            )

    # ---------------------------------------------------------
    # SAFETY
    # ---------------------------------------------------------

    if safety_change > 2:
        if language == "mn":
            drivers.append(
                f"Аюулгүй ажиллагааны үзүүлэлт "
                f"{safety_change} нэгж хувиар сайжирсан."
            )
        else:
            drivers.append(
                f"Safety score improved by "
                f"{safety_change} percentage points."
            )

    elif safety_change < -2:
        if language == "mn":
            drivers.append(
                f"Аюулгүй ажиллагааны үзүүлэлт "
                f"{abs(safety_change)} нэгж хувиар буурсан."
            )

            recommendations.append(
                "Аюулгүй ажиллагааны осол, "
                "осолд дөхсөн тохиолдлууд болон "
                "чухал эрсдэлийн хяналтыг шалгана уу."
            )

        else:
            drivers.append(
                f"Safety score declined by "
                f"{abs(safety_change)} percentage points."
            )

            recommendations.append(
                "Review safety incidents, near misses, "
                "and critical risk controls."
            )

    # ---------------------------------------------------------
    # DEFAULT DRIVER
    # ---------------------------------------------------------

    if not drivers:
        if language == "mn":
            drivers.append(
                "Боломжит тайлангийн хугацаанд "
                "KPI үзүүлэлтүүдэд томоохон өөрчлөлт "
                "илрээгүй байна."
            )
        else:
            drivers.append(
                "No major KPI movement detected across "
                "the available reporting period."
            )

    # ---------------------------------------------------------
    # DEFAULT RECOMMENDATION
    # ---------------------------------------------------------

    if not recommendations:
        if language == "mn":
            recommendations.append(
                "Үйл ажиллагааны одоогийн хэмнэлийг "
                "хадгалж, тэргүүлэх үзүүлэлтүүдийн "
                "хяналтыг үргэлжлүүлнэ үү."
            )
        else:
            recommendations.append(
                "Maintain current operating rhythm and "
                "continue monitoring leading indicators."
            )

    # ---------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------

    if language == "mn":
        if direction_code == "improving":
            direction_sentence = "сайжирч байна"
        elif direction_code == "declining":
            direction_sentence = "буурч байна"
        else:
            direction_sentence = "тогтвортой байна"

        summary = (
            f"Боломжит тайлангийн хугацаанд уурхайн "
            f"эрүүл мэндийн үзүүлэлт {direction_sentence}. "
            f"Оноо {first_health}% -аас "
            f"{latest_health}% болж өөрчлөгдсөн бөгөөд "
            f"нийт өөрчлөлт {change_percent} нэгж хувь байна."
        )

        status = (
            "Уурхайн эрүүл мэндийн түүхэн мэдээлэлд "
            "үндэслэн чиг хандлагын шинжилгээ үүсгэгдсэн"
        )

    else:
        summary = (
            f"Mine Health is {direction.lower()} over "
            f"the available reporting period. "
            f"The score changed from {first_health}% "
            f"to {latest_health}%, "
            f"a movement of {change_percent} "
            f"percentage points."
        )

        status = (
            "Trend analysis generated from health history"
        )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "mine_name": mine_name,
        "start_date": first["report_date"],
        "end_date": latest["report_date"],
        "direction": direction,
        "direction_code": direction_code,
        "change_percent": change_percent,
        "summary": summary,
        "drivers": drivers,
        "recommendations": recommendations,
        "status": status,
        "language": language,
    }