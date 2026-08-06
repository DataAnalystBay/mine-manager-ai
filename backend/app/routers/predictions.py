from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import SessionLocal
from app.services.predictive.prediction_engine import calculate_prediction
from app.services.trend_engine_service import get_health_history_service


router = APIRouter(
    prefix="/api/predictions",
    tags=["Predictive Intelligence"],
    dependencies=[
        Depends(get_current_user),
    ],
)


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    """
    Create and safely close a database session.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# HISTORY NORMALIZATION
# ============================================================

def normalize_history_response(
    history_response: Any,
) -> List[Dict[str, Any]]:
    """
    Convert the existing health-history response into a list of records.

    Supported response structures:

    1. Direct list:
       [
           {"health": 85},
           {"health": 87},
       ]

    2. Dictionary containing one of these list keys:
       {
           "history": [...]
       }

       {
           "data": [...]
       }

       {
           "records": [...]
       }

       {
           "results": [...]
       }

       {
           "health_history": [...]
       }
    """

    if isinstance(history_response, list):
        return history_response

    if not isinstance(history_response, dict):
        return []

    possible_list_keys = [
        "history",
        "data",
        "records",
        "results",
        "health_history",
    ]

    for key in possible_list_keys:
        records = history_response.get(key)

        if isinstance(records, list):
            return records

    return []


def extract_numeric_history(
    records: List[Dict[str, Any]],
    possible_keys: List[str],
) -> List[float]:
    """
    Extract numeric KPI values from historical records.

    The first available matching field is used for each record.
    Invalid and non-numeric values are ignored.
    """

    values: List[float] = []

    for record in records:
        if not isinstance(record, dict):
            continue

        for key in possible_keys:
            value = record.get(key)

            if value is None:
                continue

            try:
                values.append(float(value))
            except (TypeError, ValueError):
                pass

            break

    return values


# ============================================================
# KPI PREDICTION BUILDER
# ============================================================

def build_kpi_prediction(
    history: List[float],
    kpi_name: str,
) -> Dict[str, Any]:
    """
    Build a consistent three-shift prediction response for one KPI.

    Empty or all-zero histories are returned as unavailable by the
    prediction engine.
    """

    prediction = calculate_prediction(history)

    if prediction["data_status"] == "Unavailable":
        return {
            "kpi_name": kpi_name,
            "data_status": "Unavailable",
            "current_value": None,
            "forecast_next_shift": None,
            "forecast_shift_2": None,
            "forecast_shift_3": None,
            "variance_next_shift": None,
            "variance_shift_3": None,
            "forecast_direction": "Unavailable",
            "trend": "Unavailable",
            "confidence": 0,
            "slope": None,
            "history_points": 0,
        }

    current_value = round(
        float(history[-1]),
        1,
    )

    next_shift = prediction["forecast_next_shift"]
    shift_2 = prediction["forecast_shift_2"]
    shift_3 = prediction["forecast_shift_3"]

    variance_next_shift = round(
        next_shift - current_value,
        1,
    )

    variance_shift_3 = round(
        shift_3 - current_value,
        1,
    )

    if variance_shift_3 > 0:
        direction = "Increase"
    elif variance_shift_3 < 0:
        direction = "Decrease"
    else:
        direction = "No Change"

    return {
        "kpi_name": kpi_name,
        "data_status": "Available",
        "current_value": current_value,
        "forecast_next_shift": next_shift,
        "forecast_shift_2": shift_2,
        "forecast_shift_3": shift_3,
        "variance_next_shift": variance_next_shift,
        "variance_shift_3": variance_shift_3,
        "forecast_direction": direction,
        "trend": prediction["trend"],
        "confidence": prediction["confidence"],
        "slope": prediction["slope"],
        "history_points": prediction["history_points"],
    }


# ============================================================
# EXECUTIVE SUMMARY HELPERS
# ============================================================

def get_available_predictions(
    predictions: Dict[str, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Return only predictions with valid historical data.
    """

    return [
        prediction
        for prediction in predictions.values()
        if prediction["data_status"] == "Available"
        and prediction["history_points"] > 0
    ]


def calculate_overall_confidence(
    predictions: Dict[str, Dict[str, Any]],
) -> float:
    """
    Calculate average confidence using only available forecasts.
    """

    available_predictions = get_available_predictions(
        predictions,
    )

    if not available_predictions:
        return 0

    confidence_total = sum(
        prediction["confidence"]
        for prediction in available_predictions
    )

    return round(
        confidence_total / len(available_predictions),
        1,
    )


def format_kpi_list(
    kpi_names: List[str],
) -> str:
    """
    Format KPI names into readable executive text.

    Examples:
        ["Ore Production"]
        -> "Ore Production"

        ["Ore Production", "Fleet Performance"]
        -> "Ore Production and Fleet Performance"

        ["Ore Production", "Fleet Performance", "Plant Performance"]
        -> "Ore Production, Fleet Performance, and Plant Performance"
    """

    if not kpi_names:
        return ""

    if len(kpi_names) == 1:
        return kpi_names[0]

    if len(kpi_names) == 2:
        return f"{kpi_names[0]} and {kpi_names[1]}"

    return (
        f"{', '.join(kpi_names[:-1])}, "
        f"and {kpi_names[-1]}"
    )


def build_executive_outlook(
    predictions: Dict[str, Dict[str, Any]],
) -> Dict[str, str]:
    """
    Build the overall outlook and executive message.

    Declining KPIs receive priority because they may require management
    action before the next shift.
    """

    available_predictions = get_available_predictions(
        predictions,
    )

    if not available_predictions:
        return {
            "overall_outlook": "Insufficient Data",
            "executive_message": (
                "Not enough historical KPI data is available to generate "
                "a reliable forecast."
            ),
        }

    declining_kpis = [
        prediction["kpi_name"]
        for prediction in available_predictions
        if prediction["trend"] == "Declining"
    ]

    improving_kpis = [
        prediction["kpi_name"]
        for prediction in available_predictions
        if prediction["trend"] == "Improving"
    ]

    stable_kpis = [
        prediction["kpi_name"]
        for prediction in available_predictions
        if prediction["trend"] == "Stable"
    ]

    if declining_kpis:
        declining_text = format_kpi_list(
            declining_kpis,
        )

        verb = (
            "is"
            if len(declining_kpis) == 1
            else "are"
        )

        return {
            "overall_outlook": "Attention Required",
            "executive_message": (
                f"{declining_text} {verb} forecast to decline "
                "over the next three shifts based on recent performance."
            ),
        }

    if improving_kpis:
        improving_text = format_kpi_list(
            improving_kpis,
        )

        verb = (
            "is"
            if len(improving_kpis) == 1
            else "are"
        )

        return {
            "overall_outlook": "Improving",
            "executive_message": (
                f"{improving_text} {verb} forecast to improve "
                "over the next three shifts based on recent performance."
            ),
        }

    if stable_kpis:
        return {
            "overall_outlook": "Stable",
            "executive_message": (
                "Available KPI performance is forecast to remain broadly "
                "stable over the next three shifts."
            ),
        }

    return {
        "overall_outlook": "Stable",
        "executive_message": (
            "No significant KPI movement is forecast over the next "
            "three shifts."
        ),
    }


def build_data_quality_summary(
    predictions: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Summarize which KPI forecasts are available and unavailable.
    """

    available_kpis = [
        prediction["kpi_name"]
        for prediction in predictions.values()
        if prediction["data_status"] == "Available"
    ]

    unavailable_kpis = [
        prediction["kpi_name"]
        for prediction in predictions.values()
        if prediction["data_status"] == "Unavailable"
    ]

    if not unavailable_kpis:
        data_quality_status = "Complete"
    elif available_kpis:
        data_quality_status = "Partial"
    else:
        data_quality_status = "Unavailable"

    return {
        "data_quality_status": data_quality_status,
        "available_kpis": available_kpis,
        "unavailable_kpis": unavailable_kpis,
        "available_count": len(available_kpis),
        "unavailable_count": len(unavailable_kpis),
    }


# ============================================================
# PREDICTION SUMMARY ENDPOINT
# ============================================================

@router.get("/summary")
def get_prediction_summary(
    mine_name: str = Query(default="Oyu Tolgoi Surface"),
    db: Session = Depends(get_db),
):
    """
    Return Predictive Intelligence for Mine Health and component KPIs.

    Forecast horizons:
    - Next shift
    - Shift +2
    - Shift +3

    The Version 1.0 engine uses explainable statistical forecasting.
    Empty or all-zero histories are treated as unavailable rather than
    as genuine 0% operational performance.
    """

    history_response = get_health_history_service(
        mine_name=mine_name,
        db=db,
    )

    records = normalize_history_response(
        history_response,
    )

    # --------------------------------------------------------
    # Extract KPI histories
    # --------------------------------------------------------

    health_history = extract_numeric_history(
        records,
        [
            "health",
            "health_score",
            "mine_health",
            "mine_health_score",
        ],
    )

    ore_history = extract_numeric_history(
        records,
        [
            "ore",
            "ore_score",
            "ore_performance",
            "production_score",
        ],
    )

    waste_history = extract_numeric_history(
        records,
        [
            "waste",
            "waste_score",
            "waste_performance",
        ],
    )

    fleet_history = extract_numeric_history(
        records,
        [
            "fleet",
            "fleet_score",
            "fleet_performance",
        ],
    )

    plant_history = extract_numeric_history(
        records,
        [
            "plant",
            "plant_score",
            "plant_performance",
        ],
    )

    safety_history = extract_numeric_history(
        records,
        [
            "safety_score",
            "safety",
        ],
    )

    # --------------------------------------------------------
    # Build KPI predictions
    # --------------------------------------------------------

    predictions = {
        "mine_health": build_kpi_prediction(
            health_history,
            "Mine Health",
        ),
        "ore_production": build_kpi_prediction(
            ore_history,
            "Ore Production",
        ),
        "waste_movement": build_kpi_prediction(
            waste_history,
            "Waste Movement",
        ),
        "fleet_performance": build_kpi_prediction(
            fleet_history,
            "Fleet Performance",
        ),
        "plant_performance": build_kpi_prediction(
            plant_history,
            "Plant Performance",
        ),
        "safety_performance": build_kpi_prediction(
            safety_history,
            "Safety Performance",
        ),
    }

    overall_confidence = calculate_overall_confidence(
        predictions,
    )

    outlook = build_executive_outlook(
        predictions,
    )

    data_quality = build_data_quality_summary(
        predictions,
    )

    return {
        "mine_name": mine_name,
        "forecast_horizon": {
            "next_shift": 1,
            "shift_2": 2,
            "shift_3": 3,
        },
        "overall_outlook": outlook["overall_outlook"],
        "overall_confidence": overall_confidence,
        "executive_message": outlook["executive_message"],
        "data_quality": data_quality,
        "available_prediction_count": data_quality["available_count"],
        "predictions": predictions,
        "status": (
            "Predictive intelligence generated"
            if data_quality["available_count"] > 0
            else "Insufficient historical data"
        ),
    }