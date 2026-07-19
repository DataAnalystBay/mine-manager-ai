"""
Shared Analytics Engine for Mine Manager AI.

This service combines reusable KPI calculations and historical trend
analytics into one consistent response for:

- Executive Dashboard
- PDF Reports
- Executive Briefing
- Future Board Packs
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.services.trend_engine_service import (
    get_health_history_service,
    get_trend_analysis_service,
)


ANALYTICS_VERSION = "1.0"


def _build_metadata(days: int) -> Dict[str, Any]:
    """
    Build metadata for the analytics response.
    """

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_source": "shared_analytics_engine",
        "analytics_version": ANALYTICS_VERSION,
        "period_days": days,
    }


def _build_empty_response(
    mine_name: str,
    report_date: Optional[date],
    days: int,
) -> Dict[str, Any]:
    """
    Return the standard shared analytics response contract.
    """

    selected_date = report_date or date.today()

    return {
        "mine": {
            "mine_name": mine_name,
            "report_date": selected_date.isoformat(),
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
        "metadata": _build_metadata(days),
    }


def _build_kpis_from_latest_history(
    latest: Dict[str, Any],
) -> Dict[str, Dict[str, Any]]:
    """
    Convert the latest health-history record into reusable KPI objects.
    """

    return {
        "production": {
            "ore_achievement": latest.get("ore", 0),
            "waste_achievement": latest.get("waste", 0),
        },
        "fleet": {
            "fleet_score": latest.get("fleet", 0),
        },
        "plant": {
            "plant_score": latest.get("plant", 0),
            "throughput_achievement": latest.get("throughput", 0),
            "recovery": latest.get("recovery", 0),
        },
        "safety": {
            "safety_score": latest.get("safety_score", 0),
        },
        "maintenance": {},
    }


def _build_metric_trends(
    history: list[Dict[str, Any]],
) -> Dict[str, list[Dict[str, Any]]]:
    """
    Convert health-history rows into chart-ready trend series.
    """

    return {
        "mine_health": [
            {
                "report_date": row.get("report_date"),
                "value": row.get("health", 0),
            }
            for row in history
        ],
        "production": [
            {
                "report_date": row.get("report_date"),
                "ore": row.get("ore", 0),
                "waste": row.get("waste", 0),
            }
            for row in history
        ],
        "fleet": [
            {
                "report_date": row.get("report_date"),
                "value": row.get("fleet", 0),
            }
            for row in history
        ],
        "plant": [
            {
                "report_date": row.get("report_date"),
                "plant_score": row.get("plant", 0),
                "throughput": row.get("throughput", 0),
                "recovery": row.get("recovery", 0),
            }
            for row in history
        ],
        "safety": [
            {
                "report_date": row.get("report_date"),
                "value": row.get("safety_score", 0),
            }
            for row in history
        ],
        "maintenance": [],
    }


def get_shared_analytics(
    db: Session,
    mine_name: str,
    report_date: Optional[date] = None,
    days: int = 7,
) -> Dict[str, Any]:
    """
    Main entry point for shared executive analytics.

    Uses the existing trend engine as the current source of historical
    KPI and Mine Health data.
    """

    if not mine_name or not mine_name.strip():
        raise ValueError("mine_name is required")

    if days < 1:
        raise ValueError("days must be greater than or equal to 1")

    response = _build_empty_response(
        mine_name=mine_name,
        report_date=report_date,
        days=days,
    )

    health_result = get_health_history_service(
        mine_name=mine_name,
        db=db,
    )

    full_history = health_result.get("history", [])

    # Return only the requested recent period.
    history = full_history[-days:] if days else full_history

    if not history:
        response["summary"]["status"] = "no_operational_data"
        return response

    latest = history[-1]

    trend_analysis = get_trend_analysis_service(
        mine_name=mine_name,
        db=db,
    )

    response["summary"] = {
        "mine_health": latest.get("health", 0),
        "direction": trend_analysis.get("direction", "No Data"),
        "change_percent": trend_analysis.get("change_percent", 0),
        "period": f"last_{days}_days",
        "status": "available",
    }

    response["kpis"] = _build_kpis_from_latest_history(latest)
    response["trends"] = _build_metric_trends(history)

    response["insights"] = trend_analysis.get("drivers", [])

    response["priority_actions"] = [
        {
            "priority": "medium",
            "title": recommendation,
            "source": "trend_engine",
        }
        for recommendation in trend_analysis.get("recommendations", [])
    ]

    return response