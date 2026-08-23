"""
Shared Analytics Engine for Mine Manager AI.

This service combines reusable KPI calculations and historical
trend analytics into one consistent response for:

- Executive Dashboard
- PDF Reports
- Executive Briefing
- Future Board Packs

Tenant-aware V1.0 behavior:
- company_id + mine_id are preferred as the operational boundary.
- mine_name remains supported for backward compatibility.
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.services.trend_engine_service import (
    get_health_history_service,
    get_trend_analysis_service,
)


ANALYTICS_VERSION = "1.2"


# ============================================================
# METADATA
# ============================================================

def _build_metadata(
    days: int,
    company_id: int | None = None,
    mine_id: int | None = None,
    operation_profile: str = "standard_mine",
) -> Dict[str, Any]:
    """
    Build metadata for the analytics response.
    """

    return {
        "generated_at": (
            datetime.now(timezone.utc).isoformat()
        ),
        "data_source": "shared_analytics_engine",
        "analytics_version": ANALYTICS_VERSION,
        "period_days": days,
        "tenant": {
            "company_id": company_id,
            "mine_id": mine_id,
            "operation_profile": operation_profile,
            "boundary": (
                "company_id+mine_id"
                if (
                    company_id is not None
                    and mine_id is not None
                )
                else "legacy_mine_name"
            ),
        },
    }


# ============================================================
# EMPTY TREND CARD
# ============================================================

def _empty_trend_card(
    days: int,
) -> Dict[str, Any]:
    """
    Return a stable KPI trend-card response when
    no data is available.
    """

    return {
        "value": 0,
        "previous_value": 0,
        "change": 0,
        "change_percent": 0,
        "direction": "no_data",
        "period_label": f"Last {days} Days",
        "trend": [],
    }


# ============================================================
# EMPTY RESPONSE
# ============================================================

def _build_empty_response(
    mine_name: str,
    report_date: Optional[date],
    days: int,
    company_id: int | None = None,
    mine_id: int | None = None,
    operation_profile: str = "standard_mine",
) -> Dict[str, Any]:
    """
    Return the standard shared analytics response contract.
    """

    selected_date = (
        report_date or date.today()
    )

    normalized_operation_profile = str(
        operation_profile or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

    return {
        "mine": {
            "company_id": company_id,
            "mine_id": mine_id,
            "mine_name": mine_name,
            "report_date": (
                selected_date.isoformat()
            ),
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
        },
        "summary": {
            "mine_health": None,
            "direction": "No Data",
            "change_percent": 0,
            "period": f"last_{days}_days",
            "status": "no_data",
        },
        "kpis": {
            "production": {},
            "fleet": {},
            "plant": {},
            "safety": {},
            "maintenance": {},
        },
        "kpi_trend_cards": {
            "mine_health": (
                _empty_trend_card(days)
            ),
            "ore": (
                _empty_trend_card(days)
            ),
            "waste": (
                _empty_trend_card(days)
            ),
            "fleet": (
                _empty_trend_card(days)
            ),
            "plant": (
                _empty_trend_card(days)
            ),
            "safety": (
                _empty_trend_card(days)
            ),
        },
        "trends": {
            "mine_health": [],
            "production": [],
            "fleet": [],
            "plant": [],
            "safety": [],
            "maintenance": [],
        },
        "insights": [],
        "risks": [],
        "priority_actions": [],
        "metadata": _build_metadata(
            days=days,
            company_id=company_id,
            mine_id=mine_id,
            operation_profile=(
                normalized_operation_profile
            ),
        ),
    }


# ============================================================
# KPI OBJECTS
# ============================================================

def _build_kpis_from_latest_history(
    latest: Dict[str, Any],
    operation_profile: str = "standard_mine",
) -> Dict[str, Dict[str, Any]]:
    """
    Convert the latest health-history record into
    reusable KPI objects.
    """

    normalized_operation_profile = str(
        operation_profile or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

    production = {
        "ore_achievement": latest.get(
            "ore",
            0,
        ),
        "waste_achievement": latest.get(
            "waste",
            0,
        ),
    }

    if is_sxew:
        production[
            "production_label"
        ] = "Cathode Production"

        production[
            "waste_applicable"
        ] = False

    else:
        production[
            "production_label"
        ] = "Ore Production"

        production[
            "waste_applicable"
        ] = True

    fleet = {
        "fleet_score": latest.get(
            "fleet",
            0,
        ),
        "applicable": not is_sxew,
    }

    plant = {
        "plant_score": latest.get(
            "plant",
            0,
        ),
        "throughput_achievement": (
            latest.get(
                "throughput",
                0,
            )
        ),
        "recovery": latest.get(
            "recovery",
            0,
        ),
    }

    safety = {
        "safety_score": latest.get(
            "safety_score",
            0,
        ),
    }

    return {
        "production": production,
        "fleet": fleet,
        "plant": plant,
        "safety": safety,
        "maintenance": {},
    }


# ============================================================
# METRIC TREND SERIES
# ============================================================

def _build_metric_trends(
    history: list[Dict[str, Any]],
) -> Dict[
    str,
    list[Dict[str, Any]],
]:
    """
    Convert health-history rows into
    chart-ready trend series.
    """

    return {
        "mine_health": [
            {
                "report_date": row.get(
                    "report_date"
                ),
                "value": row.get(
                    "health",
                    0,
                ),
            }
            for row in history
        ],
        "production": [
            {
                "report_date": row.get(
                    "report_date"
                ),
                "ore": row.get(
                    "ore",
                    0,
                ),
                "waste": row.get(
                    "waste",
                    0,
                ),
            }
            for row in history
        ],
        "fleet": [
            {
                "report_date": row.get(
                    "report_date"
                ),
                "value": row.get(
                    "fleet",
                    0,
                ),
            }
            for row in history
        ],
        "plant": [
            {
                "report_date": row.get(
                    "report_date"
                ),
                "plant_score": row.get(
                    "plant",
                    0,
                ),
                "throughput": row.get(
                    "throughput",
                    0,
                ),
                "recovery": row.get(
                    "recovery",
                    0,
                ),
            }
            for row in history
        ],
        "safety": [
            {
                "report_date": row.get(
                    "report_date"
                ),
                "value": row.get(
                    "safety_score",
                    0,
                ),
            }
            for row in history
        ],
        "maintenance": [],
    }


# ============================================================
# KPI TREND SUMMARY
# ============================================================

def _calculate_kpi_trend_summary(
    history: list[Dict[str, Any]],
    metric_name: str,
    days: int,
) -> Dict[str, Any]:
    """
    Build a reusable KPI trend summary from
    historical records.

    The earliest valid record in the selected
    period is used as the comparison value.

    The latest valid record is the current value.
    """

    valid_points = []

    for row in history:
        raw_value = row.get(
            metric_name
        )

        if raw_value is None:
            continue

        try:
            numeric_value = float(
                raw_value
            )

        except (
            TypeError,
            ValueError,
        ):
            continue

        valid_points.append(
            {
                "report_date": row.get(
                    "report_date"
                ),
                "value": round(
                    numeric_value,
                    1,
                ),
            }
        )

    if not valid_points:
        return _empty_trend_card(
            days
        )

    latest_point = (
        valid_points[-1]
    )

    current_value = (
        latest_point["value"]
    )

    if len(valid_points) == 1:
        return {
            "value": current_value,
            "previous_value": (
                current_value
            ),
            "change": 0,
            "change_percent": 0,
            "direction": "stable",
            "period_label": (
                f"Last {days} Days"
            ),
            "trend": valid_points,
        }

    previous_point = (
        valid_points[0]
    )

    previous_value = (
        previous_point["value"]
    )

    change = round(
        current_value
        - previous_value,
        1,
    )

    if previous_value == 0:
        change_percent = 0

    else:
        change_percent = round(
            (
                change
                / abs(
                    previous_value
                )
            )
            * 100,
            1,
        )

    if change > 0:
        direction = "up"

    elif change < 0:
        direction = "down"

    else:
        direction = "stable"

    return {
        "value": current_value,
        "previous_value": previous_value,
        "change": change,
        "change_percent": (
            change_percent
        ),
        "direction": direction,
        "period_label": (
            f"Last {days} Days"
        ),
        "trend": valid_points,
    }


# ============================================================
# KPI TREND CARDS
# ============================================================

def _build_kpi_trend_cards(
    history: list[Dict[str, Any]],
    days: int,
    operation_profile: str = "standard_mine",
) -> Dict[str, Dict[str, Any]]:
    """
    Build all executive KPI trend-card payloads.
    """

    normalized_operation_profile = str(
        operation_profile or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

    cards = {
        "mine_health": (
            _calculate_kpi_trend_summary(
                history=history,
                metric_name="health",
                days=days,
            )
        ),
        "ore": (
            _calculate_kpi_trend_summary(
                history=history,
                metric_name="ore",
                days=days,
            )
        ),
        "waste": (
            _calculate_kpi_trend_summary(
                history=history,
                metric_name="waste",
                days=days,
            )
        ),
        "fleet": (
            _calculate_kpi_trend_summary(
                history=history,
                metric_name="fleet",
                days=days,
            )
        ),
        "plant": (
            _calculate_kpi_trend_summary(
                history=history,
                metric_name="plant",
                days=days,
            )
        ),
        "safety": (
            _calculate_kpi_trend_summary(
                history=history,
                metric_name=(
                    "safety_score"
                ),
                days=days,
            )
        ),
    }

    if is_sxew:
        cards["waste"][
            "applicable"
        ] = False

        cards["fleet"][
            "applicable"
        ] = False

    else:
        cards["waste"][
            "applicable"
        ] = True

        cards["fleet"][
            "applicable"
        ] = True

    cards["mine_health"][
        "applicable"
    ] = True

    cards["ore"][
        "applicable"
    ] = True

    cards["plant"][
        "applicable"
    ] = True

    cards["safety"][
        "applicable"
    ] = True

    return cards


# ============================================================
# SHARED ANALYTICS
# ============================================================

def get_shared_analytics(
    db: Session,
    mine_name: str,
    report_date: Optional[date] = None,
    days: int = 7,
    language: str = "en",
    company_id: int | None = None,
    mine_id: int | None = None,
    operation_profile: str = "standard_mine",
) -> Dict[str, Any]:
    """
    Main entry point for shared executive analytics.

    Preferred operational tenant boundary:

        company_id + mine_id

    mine_name remains supported for backward
    compatibility with older internal callers.

    Uses the trend engine as the source of
    historical KPI and Mine Health data.
    """

    cleaned_mine_name = (
        mine_name.strip()
        if mine_name
        else ""
    )

    if not cleaned_mine_name:
        raise ValueError(
            "mine_name is required"
        )

    if days < 1:
        raise ValueError(
            "days must be greater "
            "than or equal to 1"
        )

    normalized_operation_profile = str(
        operation_profile
        or "standard_mine"
    ).strip().lower()

    response = _build_empty_response(
        mine_name=cleaned_mine_name,
        report_date=report_date,
        days=days,
        company_id=company_id,
        mine_id=mine_id,
        operation_profile=(
            normalized_operation_profile
        ),
    )

    # --------------------------------------------------------
    # Health History
    # --------------------------------------------------------

    health_result = (
        get_health_history_service(
            mine_name=(
                cleaned_mine_name
            ),
            db=db,
            company_id=company_id,
            mine_id=mine_id,
            operation_profile=(
                normalized_operation_profile
            ),
        )
    )

    full_history = (
        health_result.get(
            "history",
            [],
        )
    )

    # Return only requested recent period.
    history = full_history[
        -days:
    ]

    if not history:
        response[
            "summary"
        ][
            "status"
        ] = "no_operational_data"

        return response

    latest = history[-1]

    # --------------------------------------------------------
    # Trend Analysis
    # --------------------------------------------------------

    trend_analysis = (
        get_trend_analysis_service(
            mine_name=(
                cleaned_mine_name
            ),
            db=db,
            language=language,
            company_id=company_id,
            mine_id=mine_id,
            operation_profile=(
                normalized_operation_profile
            ),
        )
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    response["summary"] = {
        "mine_health": latest.get(
            "health",
            0,
        ),
        "direction": (
            trend_analysis.get(
                "direction",
                "No Data",
            )
        ),
        "direction_code": (
            trend_analysis.get(
                "direction_code",
                "no_data",
            )
        ),
        "change_percent": (
            trend_analysis.get(
                "change_percent",
                0,
            )
        ),
        "period": (
            f"last_{days}_days"
        ),
        "status": "available",
    }

    # --------------------------------------------------------
    # KPI Summary
    # --------------------------------------------------------

    response["kpis"] = (
        _build_kpis_from_latest_history(
            latest=latest,
            operation_profile=(
                normalized_operation_profile
            ),
        )
    )

    # --------------------------------------------------------
    # Trend Cards
    # --------------------------------------------------------

    response[
        "kpi_trend_cards"
    ] = _build_kpi_trend_cards(
        history=history,
        days=days,
        operation_profile=(
            normalized_operation_profile
        ),
    )

    # --------------------------------------------------------
    # Trend Series
    # --------------------------------------------------------

    response["trends"] = (
        _build_metric_trends(
            history
        )
    )

    # --------------------------------------------------------
    # Insights
    # --------------------------------------------------------

    response["insights"] = (
        trend_analysis.get(
            "drivers",
            [],
        )
    )

    # --------------------------------------------------------
    # Priority Actions
    # --------------------------------------------------------

    response[
        "priority_actions"
    ] = [
        {
            "priority": "medium",
            "title": recommendation,
            "source": (
                "trend_engine"
            ),
        }
        for recommendation in (
            trend_analysis.get(
                "recommendations",
                [],
            )
        )
    ]

    # --------------------------------------------------------
    # Final metadata
    # --------------------------------------------------------

    response["metadata"] = (
        _build_metadata(
            days=days,
            company_id=company_id,
            mine_id=mine_id,
            operation_profile=(
                normalized_operation_profile
            ),
        )
    )

    return response