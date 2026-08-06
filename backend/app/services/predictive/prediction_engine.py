from statistics import mean
from typing import Any, Dict, List


def _to_numeric_history(history: List[Any]) -> List[float]:
    """
    Convert supplied history values into a clean numeric list.

    Invalid values and None values are ignored.
    """

    numeric_history: List[float] = []

    for value in history:
        try:
            if value is not None:
                numeric_history.append(float(value))
        except (TypeError, ValueError):
            continue

    return numeric_history


def _clamp(
    value: float,
    minimum: float = 0,
    maximum: float = 100,
) -> float:
    """
    Keep percentage-based forecasts within a realistic range.
    """

    return max(minimum, min(maximum, value))


def _is_unavailable_history(history: List[float]) -> bool:
    """
    Treat an empty or entirely zero-valued history as unavailable.

    In the current dataset, repeated zero values represent missing
    Fleet, Plant, or Safety records rather than genuine 0% performance.
    """

    if not history:
        return True

    return all(value == 0 for value in history)


def _calculate_confidence(
    history: List[float],
    slope: float,
) -> int:
    """
    Calculate an explainable confidence score.

    Confidence increases when:
    - More historical records are available
    - Recent values are relatively consistent

    Confidence decreases when:
    - The recent series is highly volatile
    - The forecast slope is unusually large
    """

    history_points = len(history)

    if history_points == 0:
        return 0

    if history_points == 1:
        return 50

    base_confidence = min(
        90,
        50 + history_points * 5,
    )

    recent = history[-5:]
    recent_average = mean(recent)

    average_deviation = mean(
        abs(value - recent_average)
        for value in recent
    )

    volatility_penalty = min(
        20,
        average_deviation * 2,
    )

    slope_penalty = min(
        10,
        abs(slope) * 2,
    )

    confidence = (
        base_confidence
        - volatility_penalty
        - slope_penalty
    )

    return int(
        round(
            max(
                40,
                min(95, confidence),
            )
        )
    )


def calculate_prediction(
    history: List[Any],
) -> Dict[str, Any]:
    """
    Generate short-term KPI forecasts for the next three shifts.

    The supplied history must be ordered from oldest to newest.

    An empty or all-zero history is treated as unavailable because the
    current source dataset uses repeated zeros for missing KPI records.
    """

    numeric_history = _to_numeric_history(history)

    if _is_unavailable_history(numeric_history):
        return {
            "data_status": "Unavailable",
            "forecast_next_shift": None,
            "forecast_shift_2": None,
            "forecast_shift_3": None,
            "confidence": 0,
            "trend": "Unavailable",
            "slope": None,
            "history_points": 0,
        }

    if len(numeric_history) == 1:
        current_value = _clamp(
            numeric_history[-1]
        )

        return {
            "data_status": "Available",
            "forecast_next_shift": round(
                current_value,
                1,
            ),
            "forecast_shift_2": round(
                current_value,
                1,
            ),
            "forecast_shift_3": round(
                current_value,
                1,
            ),
            "confidence": 50,
            "trend": "Stable",
            "slope": 0,
            "history_points": 1,
        }

    recent = (
        numeric_history[-3:]
        if len(numeric_history) >= 3
        else numeric_history
    )

    recent_average = mean(recent)

    slope = (
        recent[-1] - recent[0]
    ) / (
        len(recent) - 1
    )

    forecast_next_shift = _clamp(
        recent_average + slope
    )

    forecast_shift_2 = _clamp(
        forecast_next_shift + slope
    )

    forecast_shift_3 = _clamp(
        forecast_shift_2 + slope
    )

    if slope > 0.5:
        trend = "Improving"
    elif slope < -0.5:
        trend = "Declining"
    else:
        trend = "Stable"

    confidence = _calculate_confidence(
        history=numeric_history,
        slope=slope,
    )

    return {
        "data_status": "Available",
        "forecast_next_shift": round(
            forecast_next_shift,
            1,
        ),
        "forecast_shift_2": round(
            forecast_shift_2,
            1,
        ),
        "forecast_shift_3": round(
            forecast_shift_3,
            1,
        ),
        "confidence": confidence,
        "trend": trend,
        "slope": round(slope, 2),
        "history_points": len(numeric_history),
    }