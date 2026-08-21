from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import SessionLocal
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.services.kpi_calculation_service import calculate_health_score
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
# TENANT / OPERATION PROFILE
# ============================================================

def resolve_prediction_tenant(
    db: Session,
    mine_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Resolve the tenant and mine used by Predictive Intelligence.

    Rules:
    1. If mine_name is supplied, use that mine.
    2. If mine_name is omitted, use the latest configured mine.
       This matches the current active Achit-Ikht demo behaviour.
    """

    requested_mine_name = (
        mine_name.strip()
        if isinstance(mine_name, str) and mine_name.strip()
        else None
    )

    mine = None

    if requested_mine_name:
        mine = (
            db.query(MineSettings)
            .filter(MineSettings.mine_name == requested_mine_name)
            .first()
        )

    if mine is None and requested_mine_name is None:
        mine = (
            db.query(MineSettings)
            .order_by(MineSettings.id.desc())
            .first()
        )

    if mine is None:
        return {
            "company_id": None,
            "mine_id": None,
            "company_name": None,
            "mine_name": requested_mine_name,
            "mine_type": None,
            "operation_profile": "generic",
            "requested_mine_name": requested_mine_name,
        }

    company = (
        db.query(CompanySettings)
        .filter(CompanySettings.id == mine.company_id)
        .first()
    )

    operation_profile = resolve_operation_profile(
        mine_type=mine.mine_type,
        mine_name=mine.mine_name,
    )

    return {
        "company_id": company.id if company else mine.company_id,
        "mine_id": mine.id,
        "company_name": company.company_name if company else None,
        "mine_name": mine.mine_name,
        "mine_type": mine.mine_type,
        "operation_profile": operation_profile,
        "requested_mine_name": requested_mine_name,
    }


def resolve_operation_profile(
    mine_type: Optional[str],
    mine_name: Optional[str],
) -> str:
    """
    Determine the operational profile.

    V1.0 profiles currently supported:
    - sxew_copper
    - open_pit
    - generic
    """

    mine_type_value = (mine_type or "").strip().lower()
    mine_name_value = (mine_name or "").strip().lower()

    sxew_terms = [
        "sx-ew",
        "sxew",
        "processing plant",
        "cathode",
    ]

    if any(term in mine_type_value for term in sxew_terms):
        return "sxew_copper"

    if "achit" in mine_name_value:
        return "sxew_copper"

    open_pit_terms = [
        "open pit",
        "open-pit",
        "surface",
    ]

    if any(term in mine_type_value for term in open_pit_terms):
        return "open_pit"

    if "surface" in mine_name_value:
        return "open_pit"

    return "generic"


def get_profile_configuration(
    operation_profile: str,
) -> Dict[str, Any]:
    """
    Return operation-specific KPI applicability and display labels.
    """

    if operation_profile == "sxew_copper":
        return {
            "profile_name": "SX-EW Copper Operation",
            "applicability": {
                "mine_health": True,
                "production": True,
                "waste": False,
                "fleet": False,
                "plant": True,
                "recovery": True,
                "safety": True,
            },
            "labels": {
                "mine_health": "Mine Health",
                "production": "Cathode Production",
                "plant": "Process Plant Performance",
                "recovery": "Cu Recovery",
                "safety": "Safety Performance",
            },
        }

    if operation_profile == "open_pit":
        return {
            "profile_name": "Open Pit Mining Operation",
            "applicability": {
                "mine_health": True,
                "production": True,
                "waste": True,
                "fleet": True,
                "plant": True,
                "recovery": False,
                "safety": True,
            },
            "labels": {
                "mine_health": "Mine Health",
                "production": "Ore Production",
                "waste": "Waste Movement",
                "fleet": "Fleet Performance",
                "plant": "Plant Performance",
                "safety": "Safety Performance",
            },
        }

    return {
        "profile_name": "Mining Operation",
        "applicability": {
            "mine_health": True,
            "production": True,
            "waste": True,
            "fleet": True,
            "plant": True,
            "recovery": False,
            "safety": True,
        },
        "labels": {
            "mine_health": "Mine Health",
            "production": "Production",
            "waste": "Waste Movement",
            "fleet": "Fleet Performance",
            "plant": "Plant Performance",
            "safety": "Safety Performance",
        },
    }


# ============================================================
# HISTORY NORMALIZATION
# ============================================================

def normalize_history_response(
    history_response: Any,
) -> List[Dict[str, Any]]:
    """
    Convert the existing health-history response into a list of records.
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


def extract_numeric_value(
    record: Dict[str, Any],
    possible_keys: List[str],
) -> Optional[float]:
    """
    Extract the first valid numeric value from one historical record.
    """

    if not isinstance(record, dict):
        return None

    for key in possible_keys:
        value = record.get(key)

        if value is None:
            continue

        try:
            return float(value)
        except (TypeError, ValueError):
            continue

    return None


def build_profile_aware_health_history(
    records: List[Dict[str, Any]],
    operation_profile: str,
) -> List[float]:
    """
    Recalculate Mine Health history using the same operation-profile-aware
    KPI weighting used by the Executive Dashboard.

    This prevents non-applicable KPIs such as Waste Movement and Fleet
    Performance from reducing the Mine Health Score for SX-EW operations.
    """

    health_history: List[float] = []

    for record in records:
        if not isinstance(record, dict):
            continue

        production = extract_numeric_value(
            record,
            [
                "ore",
                "ore_score",
                "ore_performance",
                "production_score",
                "production",
                "production_performance",
                "cathode_production",
                "cathode_production_performance",
            ],
        )

        waste = extract_numeric_value(
            record,
            [
                "waste",
                "waste_score",
                "waste_performance",
            ],
        )

        fleet = extract_numeric_value(
            record,
            [
                "fleet",
                "fleet_score",
                "fleet_performance",
            ],
        )

        plant = extract_numeric_value(
            record,
            [
                "plant",
                "plant_score",
                "plant_performance",
                "process_plant",
                "process_plant_performance",
            ],
        )

        safety_score = extract_numeric_value(
            record,
            [
                "safety_score",
                "safety",
            ],
        )

        if production is None:
            continue

        if plant is None:
            continue

        if safety_score is None:
            continue

        calculated_health = calculate_health_score(
            production,
            waste or 0,
            fleet or 0,
            plant,
            safety_score,
            operation_profile,
        )

        health_history.append(
            round(
                float(calculated_health),
                1,
            )
        )

    return health_history


# ============================================================
# KPI PREDICTION BUILDER
# ============================================================

def build_kpi_prediction(
    history: List[float],
    kpi_name: str,
) -> Dict[str, Any]:
    """
    Build a consistent three-shift prediction response for one KPI.
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
    Summarize only applicable KPI forecasts.
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
        "applicable_count": len(predictions),
    }


# ============================================================
# PREDICTION SUMMARY ENDPOINT
# ============================================================

@router.get("/summary")
def get_prediction_summary(
    mine_name: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Return tenant-aware and operation-profile-aware Predictive Intelligence.

    Forecast horizons:
    - Next shift
    - Shift +2
    - Shift +3

    Non-applicable KPIs are excluded from the prediction universe.
    """

    tenant = resolve_prediction_tenant(
        db=db,
        mine_name=mine_name,
    )

    resolved_mine_name = tenant["mine_name"]

    if not resolved_mine_name:
        return {
            **tenant,
            "forecast_horizon": {
                "next_shift": 1,
                "shift_2": 2,
                "shift_3": 3,
            },
            "overall_outlook": "Insufficient Data",
            "overall_confidence": 0,
            "executive_message": (
                "No configured mine is available for Predictive Intelligence."
            ),
            "data_quality": {
                "data_quality_status": "Unavailable",
                "available_kpis": [],
                "unavailable_kpis": [],
                "available_count": 0,
                "unavailable_count": 0,
                "applicable_count": 0,
            },
            "available_prediction_count": 0,
            "applicable_prediction_count": 0,
            "predictions": {},
            "status": "No configured mine",
        }

    profile = get_profile_configuration(
        tenant["operation_profile"],
    )

    history_response = get_health_history_service(
        mine_name=resolved_mine_name,
        db=db,
    )

    records = normalize_history_response(
        history_response,
    )

    # --------------------------------------------------------
    # Extract KPI histories
    # --------------------------------------------------------

    health_history = build_profile_aware_health_history(
        records=records,
        operation_profile=tenant["operation_profile"],
    )

    production_history = extract_numeric_history(
        records,
        [
            "ore",
            "ore_score",
            "ore_performance",
            "production_score",
            "production",
            "production_performance",
            "cathode_production",
            "cathode_production_performance",
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
            "process_plant",
            "process_plant_performance",
        ],
    )

    recovery_history = extract_numeric_history(
        records,
        [
            "recovery",
            "cu_recovery",
            "cu_recovery_pct",
            "recovery_pct",
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
    # Build only applicable KPI predictions
    # --------------------------------------------------------

    applicability = profile["applicability"]
    labels = profile["labels"]

    predictions: Dict[str, Dict[str, Any]] = {}

    if applicability.get("mine_health"):
        predictions["mine_health"] = build_kpi_prediction(
            health_history,
            labels["mine_health"],
        )

    if applicability.get("production"):
        predictions["production"] = build_kpi_prediction(
            production_history,
            labels["production"],
        )

    if applicability.get("waste"):
        predictions["waste_movement"] = build_kpi_prediction(
            waste_history,
            labels["waste"],
        )

    if applicability.get("fleet"):
        predictions["fleet_performance"] = build_kpi_prediction(
            fleet_history,
            labels["fleet"],
        )

    if applicability.get("plant"):
        predictions["plant_performance"] = build_kpi_prediction(
            plant_history,
            labels["plant"],
        )

    if applicability.get("recovery"):
        predictions["cu_recovery"] = build_kpi_prediction(
            recovery_history,
            labels["recovery"],
        )

    if applicability.get("safety"):
        predictions["safety_performance"] = build_kpi_prediction(
            safety_history,
            labels["safety"],
        )

    # --------------------------------------------------------
    # Executive-level calculations
    # --------------------------------------------------------

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
        "company_id": tenant["company_id"],
        "mine_id": tenant["mine_id"],
        "company_name": tenant["company_name"],
        "mine_name": tenant["mine_name"],
        "mine_type": tenant["mine_type"],
        "operation_profile": tenant["operation_profile"],
        "operation_profile_name": profile["profile_name"],
        "applicability": applicability,
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
        "applicable_prediction_count": data_quality["applicable_count"],
        "predictions": predictions,
        "status": (
            "Predictive intelligence generated"
            if data_quality["available_count"] > 0
            else "Insufficient historical data"
        ),
    }