from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


# ============================================================
# LANGUAGE
# ============================================================

def _normalize_language(
    language: str,
) -> str:
    """
    Normalize language values to supported codes.

    Supported:
    - en
    - mn

    Defaults safely to English.
    """

    if not language:
        return "en"

    language = str(
        language
    ).strip().lower()

    if language in {
        "mn",
        "mon",
        "mongolian",
        "монгол",
    }:
        return "mn"

    return "en"


# ============================================================
# HEALTH HISTORY
# ============================================================

def get_health_history_service(
    mine_name: str,
    db: Session,
    company_id: int | None = None,
    mine_id: int | None = None,
    operation_profile: str = "standard_mine",
):
    """
    Return historical Mine Health and KPI data.

    Preferred security / tenant boundary:

        company_id + mine_id

    mine_name remains available for backward compatibility
    with older internal services that have not yet migrated
    to authenticated tenant IDs.

    When company_id and mine_id are supplied, mine_name is
    never used as the operational security boundary.
    """

    cleaned_mine_name = str(
        mine_name or ""
    ).strip()

    normalized_operation_profile = str(
        operation_profile or "standard_mine"
    ).strip().lower()

    # ========================================================
    # TENANT-AWARE QUERY
    # ========================================================

    if (
        company_id is not None
        and mine_id is not None
    ):
        rows = db.execute(
            text(
                """
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

                FROM public.production_daily AS p

                LEFT JOIN public.fleet_daily AS f
                    ON p.report_date = f.report_date
                    AND p.company_id = f.company_id
                    AND p.mine_id = f.mine_id

                LEFT JOIN public.plant_daily AS pl
                    ON p.report_date = pl.report_date
                    AND p.company_id = pl.company_id
                    AND p.mine_id = pl.mine_id

                LEFT JOIN public.safety_daily AS s
                    ON p.report_date = s.report_date
                    AND p.company_id = s.company_id
                    AND p.mine_id = s.mine_id

                WHERE p.company_id = :company_id
                  AND p.mine_id = :mine_id

                ORDER BY p.report_date ASC
                """
            ),
            {
                "company_id": company_id,
                "mine_id": mine_id,
            },
        ).mappings().all()

    # ========================================================
    # LEGACY COMPATIBILITY QUERY
    # ========================================================

    else:
        """
        Temporary backward-compatible path.

        Some V1.0 services such as Predictive Intelligence and
        Executive Insight generation still call this service
        using mine_name only.

        These callers can be migrated independently later.
        """

        if not cleaned_mine_name:
            return {
                "company_id": company_id,
                "mine_id": mine_id,
                "mine_name": cleaned_mine_name,
                "operation_profile": (
                    normalized_operation_profile
                ),
                "history": [],
                "status": (
                    "No mine name supplied for "
                    "legacy health-history lookup"
                ),
            }

        rows = db.execute(
            text(
                """
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

                FROM public.production_daily AS p

                LEFT JOIN public.fleet_daily AS f
                    ON p.report_date = f.report_date
                    AND p.mine_name = f.mine_name

                LEFT JOIN public.plant_daily AS pl
                    ON p.report_date = pl.report_date
                    AND p.mine_name = pl.mine_name

                LEFT JOIN public.safety_daily AS s
                    ON p.report_date = s.report_date
                    AND p.mine_name = s.mine_name

                WHERE p.mine_name = :mine_name

                ORDER BY p.report_date ASC
                """
            ),
            {
                "mine_name": cleaned_mine_name,
            },
        ).mappings().all()

    # ========================================================
    # CALCULATE HISTORICAL KPI VALUES
    # ========================================================

    history = []

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

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

        (
            plant,
            throughput,
            recovery,
        ) = calculate_plant_score(
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
            operation_profile=(
                normalized_operation_profile
            ),
        )

        history.append(
            {
                "report_date": str(
                    row["report_date"]
                ),
                "health": health,
                "ore": ore,
                "waste": waste,
                "fleet": fleet,
                "plant": plant,
                "throughput": throughput,
                "recovery": recovery,
                "safety_score": safety_score,
                "operation_profile": (
                    normalized_operation_profile
                ),
                "applicability": {
                    "production": True,
                    "waste": not is_sxew,
                    "fleet": not is_sxew,
                    "plant": True,
                    "safety": True,
                },
            }
        )

    return {
        "company_id": company_id,
        "mine_id": mine_id,
        "mine_name": cleaned_mine_name,
        "operation_profile": (
            normalized_operation_profile
        ),
        "history": history,
        "status": (
            "Health history generated from PostgreSQL"
        ),
    }


# ============================================================
# TREND ANALYSIS
# ============================================================

def get_trend_analysis_service(
    mine_name: str,
    db: Session,
    language: str = "en",
    company_id: int | None = None,
    mine_id: int | None = None,
    operation_profile: str = "standard_mine",
):
    """
    Generate Mine Health trend analysis.

    Preferred tenant boundary:
        company_id + mine_id

    Legacy mine_name-only callers remain supported.

    Supported languages:
    - en: English
    - mn: Mongolian
    """

    language = _normalize_language(
        language
    )

    cleaned_mine_name = str(
        mine_name or ""
    ).strip()

    normalized_operation_profile = str(
        operation_profile or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

    result = get_health_history_service(
        mine_name=cleaned_mine_name,
        db=db,
        company_id=company_id,
        mine_id=mine_id,
        operation_profile=(
            normalized_operation_profile
        ),
    )

    history = result.get(
        "history",
        [],
    )

    # ========================================================
    # NOT ENOUGH DATA
    # ========================================================

    if len(history) < 2:
        if language == "mn":
            return {
                "company_id": company_id,
                "mine_id": mine_id,
                "mine_name": cleaned_mine_name,
                "operation_profile": (
                    normalized_operation_profile
                ),
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
                "language": language,
            }

        return {
            "company_id": company_id,
            "mine_id": mine_id,
            "mine_name": cleaned_mine_name,
            "operation_profile": (
                normalized_operation_profile
            ),
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
            "language": language,
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

    # ========================================================
    # TREND DIRECTION
    # ========================================================

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

    direction = direction_map[
        direction_code
    ]

    drivers = []
    recommendations = []

    # ========================================================
    # KPI CHANGE HELPER
    # ========================================================

    def metric_change(
        metric_name,
    ):
        return round(
            float(
                latest.get(
                    metric_name,
                    0,
                )
                or 0
            )
            -
            float(
                first.get(
                    metric_name,
                    0,
                )
                or 0
            ),
            1,
        )

    ore_change = metric_change(
        "ore"
    )

    waste_change = metric_change(
        "waste"
    )

    fleet_change = metric_change(
        "fleet"
    )

    plant_change = metric_change(
        "plant"
    )

    safety_change = metric_change(
        "safety_score"
    )

    recovery_change = metric_change(
        "recovery"
    )

    # ========================================================
    # FLEET
    # ========================================================
    #
    # Fleet is not an applicable executive KPI for the
    # Achit Ikht SX-EW operating profile.
    # ========================================================

    if not is_sxew:

        if fleet_change > 2:

            if language == "mn":
                drivers.append(
                    f"Флотын гүйцэтгэл "
                    f"{fleet_change} нэгж хувиар "
                    f"сайжирсан."
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
                    f"{abs(fleet_change)} нэгж хувиар "
                    f"буурсан."
                )

                recommendations.append(
                    "Флотын бэлэн байдал, ашиглалт, "
                    "засвар үйлчилгээний саатал болон "
                    "диспетчерийн үр ашгийг шалгана уу."
                )

            else:
                drivers.append(
                    f"Fleet performance declined by "
                    f"{abs(fleet_change)} "
                    f"percentage points."
                )

                recommendations.append(
                    "Review fleet availability, utilization, "
                    "maintenance delays, and dispatch efficiency."
                )

    # ========================================================
    # PLANT
    # ========================================================

    if plant_change > 2:

        if language == "mn":
            drivers.append(
                f"Боловсруулах үйлдвэрийн гүйцэтгэл "
                f"{plant_change} нэгж хувиар "
                f"сайжирсан."
            )

        else:
            drivers.append(
                f"Plant performance improved by "
                f"{plant_change} percentage points."
            )

    elif plant_change < -2:

        if language == "mn":
            drivers.append(
                f"Боловсруулах үйлдвэрийн гүйцэтгэл "
                f"{abs(plant_change)} нэгж хувиар "
                f"буурсан."
            )

            recommendations.append(
                "Боловсруулалтын хүчин чадлын "
                "хязгаарлалт, металл авалт болон "
                "үйлдвэрийн зогсолтын шалтгааныг "
                "шалгана уу."
            )

        else:
            drivers.append(
                f"Plant performance declined by "
                f"{abs(plant_change)} "
                f"percentage points."
            )

            recommendations.append(
                "Review throughput bottlenecks, "
                "recovery performance, and "
                "plant downtime causes."
            )

    # ========================================================
    # PRODUCTION
    # ========================================================

    if ore_change > 2:

        if language == "mn":

            if is_sxew:
                drivers.append(
                    f"Катодын зэс үйлдвэрлэлийн "
                    f"гүйцэтгэл {ore_change} нэгж "
                    f"хувиар сайжирсан."
                )

            else:
                drivers.append(
                    f"Хүдрийн гүйцэтгэл "
                    f"{ore_change} нэгж хувиар "
                    f"сайжирсан."
                )

        else:

            if is_sxew:
                drivers.append(
                    f"Cathode production performance "
                    f"improved by {ore_change} "
                    f"percentage points."
                )

            else:
                drivers.append(
                    f"Ore performance improved by "
                    f"{ore_change} percentage points."
                )

    elif ore_change < -2:

        if language == "mn":

            if is_sxew:
                drivers.append(
                    f"Катодын зэс үйлдвэрлэлийн "
                    f"гүйцэтгэл {abs(ore_change)} "
                    f"нэгж хувиар буурсан."
                )

                recommendations.append(
                    "Катодын үйлдвэрлэлийн алдагдал, "
                    "үйлдвэрийн бэлэн байдал, "
                    "Cu авалт болон EW процессын "
                    "хязгаарлалтыг шалгана уу."
                )

            else:
                drivers.append(
                    f"Хүдрийн гүйцэтгэл "
                    f"{abs(ore_change)} нэгж хувиар "
                    f"буурсан."
                )

                recommendations.append(
                    "Олборлолтын дараалал, "
                    "экскаваторын хуваарилалт болон "
                    "хүдэр нийлүүлэлтийн "
                    "хязгаарлалтыг шалгана уу."
                )

        else:

            if is_sxew:
                drivers.append(
                    f"Cathode production performance "
                    f"declined by {abs(ore_change)} "
                    f"percentage points."
                )

                recommendations.append(
                    "Review cathode production losses, "
                    "plant availability, Cu recovery, "
                    "EW performance, and process constraints."
                )

            else:
                drivers.append(
                    f"Ore performance declined by "
                    f"{abs(ore_change)} "
                    f"percentage points."
                )

                recommendations.append(
                    "Review mining sequence, "
                    "shovel allocation, and "
                    "ore delivery constraints."
                )

    # ========================================================
    # WASTE
    # ========================================================
    #
    # Waste movement does not apply to the SX-EW executive
    # operating profile.
    # ========================================================

    if not is_sxew:

        if waste_change > 2:

            if language == "mn":
                drivers.append(
                    f"Хөрс хуулалтын гүйцэтгэл "
                    f"{waste_change} нэгж хувиар "
                    f"сайжирсан."
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
                    f"{abs(waste_change)} нэгж хувиар "
                    f"буурсан."
                )

                recommendations.append(
                    "Автосамосвалын хуваарилалт, "
                    "тээврийн замын саатал болон "
                    "хөрсний овоолгын хязгаарлалтыг "
                    "шалгана уу."
                )

            else:
                drivers.append(
                    f"Waste movement declined by "
                    f"{abs(waste_change)} "
                    f"percentage points."
                )

                recommendations.append(
                    "Check truck allocation, "
                    "haul road delays, and "
                    "waste dump constraints."
                )

    # ========================================================
    # RECOVERY — SX-EW
    # ========================================================

    if is_sxew:

        if recovery_change > 2:

            if language == "mn":
                drivers.append(
                    f"Cu авалт {recovery_change} "
                    f"нэгж хувиар сайжирсан."
                )

            else:
                drivers.append(
                    f"Copper recovery improved by "
                    f"{recovery_change} percentage points."
                )

        elif recovery_change < -2:

            if language == "mn":
                drivers.append(
                    f"Cu авалт {abs(recovery_change)} "
                    f"нэгж хувиар буурсан."
                )

                recommendations.append(
                    "Уусгалт, SX болон EW процессын "
                    "үзүүлэлт, уусмалын баланс болон "
                    "металл авалтын алдагдлыг шалгана уу."
                )

            else:
                drivers.append(
                    f"Copper recovery declined by "
                    f"{abs(recovery_change)} "
                    f"percentage points."
                )

                recommendations.append(
                    "Review leach, SX and EW performance, "
                    "solution balance, and copper "
                    "recovery losses."
                )

    # ========================================================
    # SAFETY
    # ========================================================

    if safety_change > 2:

        if language == "mn":
            drivers.append(
                f"Аюулгүй ажиллагааны үзүүлэлт "
                f"{safety_change} нэгж хувиар "
                f"сайжирсан."
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
                f"{abs(safety_change)} нэгж хувиар "
                f"буурсан."
            )

            recommendations.append(
                "Аюулгүй ажиллагааны осол, "
                "осолд дөхсөн тохиолдлууд болон "
                "чухал эрсдэлийн хяналтыг "
                "шалгана уу."
            )

        else:
            drivers.append(
                f"Safety score declined by "
                f"{abs(safety_change)} "
                f"percentage points."
            )

            recommendations.append(
                "Review safety incidents, near misses, "
                "and critical risk controls."
            )

    # ========================================================
    # DEFAULT DRIVER
    # ========================================================

    if not drivers:

        if language == "mn":
            drivers.append(
                "Боломжит тайлангийн хугацаанд "
                "KPI үзүүлэлтүүдэд томоохон "
                "өөрчлөлт илрээгүй байна."
            )

        else:
            drivers.append(
                "No major KPI movement detected across "
                "the available reporting period."
            )

    # ========================================================
    # DEFAULT RECOMMENDATION
    # ========================================================

    if not recommendations:

        if language == "mn":

            if is_sxew:
                recommendations.append(
                    "Катодын үйлдвэрлэл, Cu авалт, "
                    "боловсруулах үйлдвэрийн болон "
                    "аюулгүй ажиллагааны тэргүүлэх "
                    "үзүүлэлтүүдийн хяналтыг "
                    "үргэлжлүүлнэ үү."
                )

            else:
                recommendations.append(
                    "Үйл ажиллагааны одоогийн хэмнэлийг "
                    "хадгалж, тэргүүлэх үзүүлэлтүүдийн "
                    "хяналтыг үргэлжлүүлнэ үү."
                )

        else:

            if is_sxew:
                recommendations.append(
                    "Maintain the current operating rhythm "
                    "and continue monitoring cathode "
                    "production, copper recovery, plant, "
                    "and safety leading indicators."
                )

            else:
                recommendations.append(
                    "Maintain current operating rhythm and "
                    "continue monitoring leading indicators."
                )

    # ========================================================
    # SUMMARY
    # ========================================================

    if language == "mn":

        if direction_code == "improving":
            direction_sentence = (
                "сайжирч байна"
            )

        elif direction_code == "declining":
            direction_sentence = (
                "буурч байна"
            )

        else:
            direction_sentence = (
                "тогтвортой байна"
            )

        summary = (
            f"Боломжит тайлангийн хугацаанд уурхайн "
            f"эрүүл мэндийн үзүүлэлт "
            f"{direction_sentence}. "
            f"Оноо {first_health}% -аас "
            f"{latest_health}% болж өөрчлөгдсөн бөгөөд "
            f"нийт өөрчлөлт {change_percent} "
            f"нэгж хувь байна."
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

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "company_id": company_id,
        "mine_id": mine_id,
        "mine_name": cleaned_mine_name,
        "operation_profile": (
            normalized_operation_profile
        ),
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