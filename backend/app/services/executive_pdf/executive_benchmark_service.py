from typing import Dict, List


def calculate_benchmark(
    historical_data: List[Dict],
    current_value: float,
    target_value: float,
) -> Dict:
    """
    Calculate executive benchmark metrics from historical KPI values.
    """

    values = [
        float(row["value"])
        for row in historical_data
        if row.get("value") is not None
    ]

    if not values:
        return {
            "target": target_value,
            "variance": round(current_value - target_value, 1),
            "average_7": None,
            "average_30": None,
            "best": None,
            "worst": None,
            "percentile": None,
        }

    average = round(sum(values) / len(values), 1)

    best = round(max(values), 1)
    worst = round(min(values), 1)

    percentile = round(
        (
            sum(v <= current_value for v in values)
            / len(values)
        )
        * 100,
        1,
    )

    return {
        "target": round(target_value, 1),
        "variance": round(current_value - target_value, 1),
        "average_7": average,
        "average_30": average,
        "best": best,
        "worst": worst,
        "percentile": percentile,
    }