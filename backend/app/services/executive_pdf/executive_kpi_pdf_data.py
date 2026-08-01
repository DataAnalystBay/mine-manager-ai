from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app.services.analytics_engine_service import get_shared_analytics
from app.services.kpi_detail_service import get_kpi_detail

from app.services.executive_pdf.executive_benchmark_service import (
    calculate_benchmark,
)


KPI_KEY_MAP: Dict[str, Dict[str, Any]] = {
    "mine_health": {
        "detail_key": "mine_health",
        "trend_card_key": "mine_health",
        "trend_group": "mine_health",
        "trend_value_key": "value",
        "display_name": "Mine Health",
        "category": "Overall Operations",
        "default_target": 90.0,
        "default_unit": "/100",
        "higher_is_better": True,
    },
    "ore": {
        "detail_key": "ore",
        "trend_card_key": "ore",
        "trend_group": "production",
        "trend_value_key": "ore",
        "display_name": "Ore Production",
        "category": "Production",
        "default_target": 100.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "ore_production": {
        "detail_key": "ore",
        "trend_card_key": "ore",
        "trend_group": "production",
        "trend_value_key": "ore",
        "display_name": "Ore Production",
        "category": "Production",
        "default_target": 100.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "waste": {
        "detail_key": "waste",
        "trend_card_key": "waste",
        "trend_group": "production",
        "trend_value_key": "waste",
        "display_name": "Waste Movement",
        "category": "Production",
        "default_target": 100.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "waste_movement": {
        "detail_key": "waste",
        "trend_card_key": "waste",
        "trend_group": "production",
        "trend_value_key": "waste",
        "display_name": "Waste Movement",
        "category": "Production",
        "default_target": 100.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "fleet": {
        "detail_key": "fleet",
        "trend_card_key": "fleet",
        "trend_group": "fleet",
        "trend_value_key": "value",
        "display_name": "Fleet Performance",
        "category": "Fleet",
        "default_target": 90.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "fleet_availability": {
        "detail_key": "fleet",
        "trend_card_key": "fleet",
        "trend_group": "fleet",
        "trend_value_key": "value",
        "display_name": "Fleet Availability",
        "category": "Fleet",
        "default_target": 90.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "plant": {
        "detail_key": "plant",
        "trend_card_key": "plant",
        "trend_group": "plant",
        "trend_value_key": "plant_score",
        "display_name": "Plant Performance",
        "category": "Plant",
        "default_target": 95.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "plant_performance": {
        "detail_key": "plant",
        "trend_card_key": "plant",
        "trend_group": "plant",
        "trend_value_key": "plant_score",
        "display_name": "Plant Performance",
        "category": "Plant",
        "default_target": 95.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
    "safety": {
        "detail_key": "safety",
        "trend_card_key": "safety",
        "trend_group": "safety",
        "trend_value_key": "value",
        "display_name": "Safety Performance",
        "category": "Safety",
        "default_target": 100.0,
        "default_unit": "%",
        "higher_is_better": True,
    },
}


def _normalize_kpi_key(kpi_key: str) -> str:
    return (
        str(kpi_key or "")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def _to_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def _round_number(
    value: Any,
    digits: int = 1,
) -> float:
    return round(
        _to_float(value),
        digits,
    )


def _format_period(
    analytics: Dict[str, Any],
    config: Dict[str, Any],
    days: int,
) -> str:
    """
    Format the reporting period from the actual returned KPI trend dates.

    Falls back to the analytics mine report date, and finally to a
    generic period label if no valid dates are available.
    """

    trend_rows = (
        analytics.get(
            "trends",
            {},
        ).get(
            config["trend_group"],
            [],
        )
        or []
    )

    trend_dates = [
        str(row.get("report_date"))
        for row in trend_rows
        if row.get("report_date")
    ]

    if trend_dates:
        try:
            start_date = date.fromisoformat(
                trend_dates[0]
            )

            end_date = date.fromisoformat(
                trend_dates[-1]
            )

            return (
                f"{start_date.strftime('%d %b %Y')} – "
                f"{end_date.strftime('%d %b %Y')}"
            )

        except (TypeError, ValueError):
            pass

    report_date = (
        analytics.get(
            "mine",
            {},
        ).get(
            "report_date"
        )
    )

    if report_date:
        try:
            end_date = date.fromisoformat(
                str(report_date)
            )

            start_date = end_date.fromordinal(
                end_date.toordinal()
                - max(
                    days - 1,
                    0,
                )
            )

            return (
                f"{start_date.strftime('%d %b %Y')} – "
                f"{end_date.strftime('%d %b %Y')}"
            )

        except (TypeError, ValueError):
            pass

    return f"Last {days} Days"


def _status_from_achievement(
    current_value: float,
    target_value: float,
    higher_is_better: bool,
) -> str:
    if target_value == 0:
        if current_value == 0:
            return "On Target"

        return "Watch"

    if higher_is_better:
        achievement_ratio = (
            current_value / target_value
        )

    else:
        if current_value == 0:
            achievement_ratio = 1.0

        else:
            achievement_ratio = (
                target_value / current_value
            )

    if achievement_ratio >= 1:
        return "On Target"

    if achievement_ratio >= 0.95:
        return "Watch"

    return "Critical"


def _direction_label(
    direction: Any,
) -> str:
    normalized = (
        str(direction or "")
        .strip()
        .lower()
    )

    labels = {
        "up": "Improving",
        "down": "Declining",
        "stable": "Stable",
        "flat": "Stable",
        "improving": "Improving",
        "declining": "Declining",
        "no data": "No Data",
        "no_data": "No Data",
    }

    return labels.get(
        normalized,
        str(
            direction or "No Data"
        )
        .replace("_", " ")
        .title(),
    )


def _load_detail_fallback(
    mine_name: str,
    detail_key: str,
    days: int,
) -> Dict[str, Any]:
    """
    Load KPI target, drivers, and recommendations.

    The current kpi_detail_service still uses KPI_CONFIG demonstration
    values. Live current values and history come from Shared Analytics.
    """

    try:
        return get_kpi_detail(
            mine_name=mine_name,
            kpi_name=detail_key,
            days=days,
        )

    except (
        ValueError,
        KeyError,
        TypeError,
    ):
        return {}


def _deduplicate_history(
    rows: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Keep only one trend point per reporting date.

    The latest occurrence for a duplicated date is retained.
    """

    rows_by_date: Dict[
        str,
        Dict[str, Any],
    ] = {}

    for row in rows:
        period = str(
            row.get("period") or ""
        ).strip()

        if not period:
            continue

        rows_by_date[period] = row

    return [
        rows_by_date[period]
        for period in sorted(
            rows_by_date.keys()
        )
    ]


def _build_historical_data(
    analytics: Dict[str, Any],
    config: Dict[str, Any],
) -> List[Dict[str, Any]]:
    trend_rows = (
        analytics.get(
            "trends",
            {},
        ).get(
            config["trend_group"],
            [],
        )
        or []
    )

    historical_data: List[
        Dict[str, Any]
    ] = []

    for row in trend_rows:
        raw_value = row.get(
            config["trend_value_key"]
        )

        if raw_value is None:
            continue

        historical_data.append(
            {
                "period": str(
                    row.get(
                        "report_date"
                    )
                    or ""
                ),
                "value": _round_number(
                    raw_value
                ),
            }
        )

    return _deduplicate_history(
        historical_data
    )


def _build_root_causes(
    detail: Dict[str, Any],
    analytics: Dict[str, Any],
    category: str,
) -> List[Dict[str, Any]]:
    drivers = (
        detail.get("top_drivers")
        or []
    )

    if not drivers:
        drivers = (
            analytics.get("insights")
            or []
        )

    root_causes: List[
        Dict[str, Any]
    ] = []

    for index, driver in enumerate(
        drivers[:5],
        start=1,
    ):
        if isinstance(
            driver,
            dict,
        ):
            cause = (
                driver.get("title")
                or driver.get("driver")
                or driver.get("name")
                or driver.get("description")
                or "Operational driver"
            )

            evidence = (
                driver.get("evidence")
                or driver.get("description")
                or str(cause)
            )

            confidence = _round_number(
                driver.get(
                    "confidence",
                    75,
                )
            )

            impact = str(
                driver.get(
                    "impact",
                    "Medium",
                )
            ).title()

            driver_category = str(
                driver.get(
                    "category",
                    category,
                )
            )

        else:
            cause = str(driver)
            evidence = str(driver)

            confidence = max(
                60,
                90 - (
                    (index - 1) * 8
                ),
            )

            impact = (
                "High"
                if index == 1
                else "Medium"
            )

            driver_category = category

        root_causes.append(
            {
                "rank": index,
                "cause": cause,
                "category": (
                    driver_category
                ),
                "impact": impact,
                "confidence": (
                    confidence
                ),
                "evidence": evidence,
                "operational_effect": (
                    "This factor may be contributing to the "
                    f"current {category.lower()} performance gap."
                ),
            }
        )

    return root_causes


def _build_ai_insight(
    kpi_name: str,
    current_value: float,
    target_value: float,
    variance: float,
    unit: str,
    trend_direction: str,
    trend_percentage: float,
    status: str,
    detail: Dict[str, Any],
    analytics: Dict[str, Any],
) -> Dict[str, Any]:
    recommendations = (
        detail.get("recommendations")
        or []
    )

    if not recommendations:
        recommendations = [
            item.get("title")
            for item in analytics.get(
                "priority_actions",
                [],
            )
            if (
                isinstance(
                    item,
                    dict,
                )
                and item.get("title")
            )
        ]

    first_recommendation = (
        recommendations[0]
        if recommendations
        else (
            "Continue monitoring "
            "operational performance."
        )
    )

    unit_suffix = (
        unit
        if unit
        else ""
    )

    return {
        "headline": (
            f"{kpi_name} is "
            f"{status.lower()} and the current "
            f"trend is {trend_direction.lower()}."
        ),
        "summary": (
            f"{kpi_name} is currently "
            f"{current_value:,.1f}{unit_suffix} "
            f"against a target of "
            f"{target_value:,.1f}{unit_suffix}. "
            f"The variance is "
            f"{variance:,.1f}{unit_suffix}, "
            f"and the selected-period trend change is "
            f"{trend_percentage:,.1f}%."
        ),
        "performance_assessment": (
            f"{trend_direction} — {status}"
        ),
        "management_attention": (
            "Required"
            if status in {
                "Watch",
                "Critical",
            }
            else "Monitor"
        ),
        "confidence": 80,
        "business_implication": str(
            first_recommendation
        ),
    }


def load_live_kpi_pdf_data(
    db: Session,
    mine_name: str,
    kpi_key: str,
    days: int = 7,
) -> Dict[str, Any]:
    """
    Convert Shared Analytics and KPI Detail outputs into the structure
    expected by generate_executive_kpi_pdf().

    Returned payload includes:

        - kpi_data
        - historical_data
        - benchmark_data
        - ai_insight_data
        - root_cause_data
        - metadata
    """

    if days < 1:
        raise ValueError(
            "days must be greater than or equal to 1"
        )

    normalized_key = _normalize_kpi_key(
        kpi_key
    )

    config = KPI_KEY_MAP.get(
        normalized_key
    )

    if config is None:
        supported = ", ".join(
            sorted(
                KPI_KEY_MAP.keys()
            )
        )

        raise ValueError(
            f"Unsupported KPI key: {kpi_key}. "
            f"Supported keys: {supported}"
        )

    analytics = get_shared_analytics(
        db=db,
        mine_name=mine_name,
        days=days,
    )

    detail = _load_detail_fallback(
        mine_name=mine_name,
        detail_key=config["detail_key"],
        days=days,
    )

    trend_card = (
        analytics.get(
            "kpi_trend_cards",
            {},
        ).get(
            config["trend_card_key"],
            {},
        )
        or {}
    )

    current_value = _round_number(
        trend_card.get(
            "value",
            detail.get(
                "current_value",
                0,
            ),
        )
    )

    target_value = _round_number(
        detail.get(
            "target",
            config["default_target"],
        )
    )

    variance = round(
        current_value - target_value,
        1,
    )

    if target_value != 0:
        achievement_percentage = round(
            (
                current_value
                / target_value
            )
            * 100,
            1,
        )

    elif current_value == 0:
        achievement_percentage = 100.0

    else:
        achievement_percentage = 0.0

    trend_percentage = _round_number(
        trend_card.get(
            "change_percent",
            detail.get(
                "change_percent",
                0,
            ),
        )
    )

    trend_direction = _direction_label(
        trend_card.get(
            "direction",
            detail.get(
                "direction",
                "No Data",
            ),
        )
    )

    unit = str(
        detail.get(
            "unit",
            config["default_unit"],
        )
    )

    status = _status_from_achievement(
        current_value=current_value,
        target_value=target_value,
        higher_is_better=(
            config["higher_is_better"]
        ),
    )

    reporting_period = _format_period(
        analytics=analytics,
        config=config,
        days=days,
    )

    kpi_data = {
        "kpi_key": normalized_key,
        "kpi_name": (
            config["display_name"]
        ),
        "current_value": current_value,
        "target_value": target_value,
        "variance": variance,
        "achievement_percentage": (
            achievement_percentage
        ),
        "status": status,
        "trend_direction": (
            trend_direction
        ),
        "trend_percentage": (
            trend_percentage
        ),
        "unit": unit,
        "reporting_period": (
            reporting_period
        ),
        "executive_interpretation": (
            f"{config['display_name']} achieved "
            f"<b>{achievement_percentage:.1f}%</b> "
            f"of target. The current value is "
            f"<b>{current_value:,.1f}{unit}</b> "
            f"against a target of "
            f"<b>{target_value:,.1f}{unit}</b>. "
            f"The selected-period trend is "
            f"<b>{trend_direction.lower()}</b>."
        ),
    }

    # --------------------------------------------------
    # Historical KPI trend
    # --------------------------------------------------

    historical_data = _build_historical_data(
        analytics=analytics,
        config=config,
    )

    # --------------------------------------------------
    # Executive benchmark calculations
    # --------------------------------------------------

    benchmark_data = calculate_benchmark(
        historical_data=historical_data,
        current_value=current_value,
        target_value=target_value,
    )

    # Add helpful KPI context to the benchmark payload.
    benchmark_data.update(
        {
            "kpi_key": normalized_key,
            "kpi_name": (
                config["display_name"]
            ),
            "unit": unit,
            "current_value": (
                current_value
            ),
            "higher_is_better": (
                config["higher_is_better"]
            ),
            "reporting_period": (
                reporting_period
            ),
            "observation_count": len(
                historical_data
            ),
        }
    )

    # --------------------------------------------------
    # Root causes
    # --------------------------------------------------

    root_cause_data = _build_root_causes(
        detail=detail,
        analytics=analytics,
        category=config["category"],
    )

    # --------------------------------------------------
    # AI executive insight
    # --------------------------------------------------

    ai_insight_data = _build_ai_insight(
        kpi_name=config["display_name"],
        current_value=current_value,
        target_value=target_value,
        variance=variance,
        unit=unit,
        trend_direction=trend_direction,
        trend_percentage=trend_percentage,
        status=status,
        detail=detail,
        analytics=analytics,
    )

    return {
        "kpi_data": kpi_data,
        "historical_data": (
            historical_data
        ),
        "benchmark_data": (
            benchmark_data
        ),
        "ai_insight_data": (
            ai_insight_data
        ),
        "root_cause_data": (
            root_cause_data
        ),
        "metadata": {
            "mine_name": mine_name,
            "days": days,
            "generated_at": (
                datetime.utcnow().isoformat()
            ),
            "analytics": analytics.get(
                "metadata",
                {},
            ),
        },
    }