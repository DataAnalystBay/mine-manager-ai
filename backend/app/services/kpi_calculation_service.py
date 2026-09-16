import math

from app.operation_profiles.coal_surface_profile import (
    COAL_SURFACE_PROFILE,
    evaluate_status,
)


def calculate_coal_quality_summary(
    ash_pct=None,
    moisture_pct=None,
    calorific_value=None,
):
    """Score only available, finite Coal quality measurements."""
    raw_values = {
        "ash": ash_pct,
        "total_moisture": moisture_pct,
        "calorific_value": calorific_value,
    }
    values = {}
    statuses = {}
    scores = []
    directions = {
        item[0]: item[5]
        for item in COAL_SURFACE_PROFILE["kpis"]
    }

    for code, raw_value in raw_values.items():
        value = None
        if raw_value is not None:
            try:
                candidate = float(raw_value)
                if math.isfinite(candidate):
                    value = candidate
            except (TypeError, ValueError):
                pass

        values[code] = value
        if value is None:
            continue

        threshold = COAL_SURFACE_PROFILE["thresholds"][code]
        status = evaluate_status(
            value,
            threshold["warning"],
            threshold["critical"],
            directions[code],
        )
        statuses[code] = status
        scores.append({"good": 100, "warning": 85, "critical": 60}[status])

    return {
        "values": values,
        "statuses": statuses,
        "score": round(sum(scores) / len(scores), 1) if scores else None,
    }


def safe_percentage(actual, plan):
    actual = float(actual or 0)
    plan = float(plan or 0)

    if plan <= 0:
        return 0

    return round(
        (actual / plan) * 100,
        1,
    )


def calculate_fleet_score(
    availability,
    utilization,
):
    availability = float(
        availability or 0
    )
    utilization = float(
        utilization or 0
    )

    return round(
        (
            availability
            + utilization
        )
        / 2,
        1,
    )


def calculate_plant_score(
    throughput_actual,
    throughput_plan,
    recovery,
):
    throughput = safe_percentage(
        throughput_actual,
        throughput_plan,
    )

    recovery = float(
        recovery or 0
    )

    plant = round(
        throughput * 0.6
        + recovery * 0.4,
        1,
    )

    return (
        plant,
        throughput,
        recovery,
    )


def calculate_weighted_score(
    components,
):
    """
    Calculate a weighted score using only applicable components.

    Expected format:

    components = [
        {
            "value": 90,
            "weight": 0.30,
            "applicable": True,
        },
        ...
    ]

    If a component is not applicable, its weight is removed
    and the remaining weights are normalized automatically.
    """

    active_components = [
        component
        for component in components
        if component.get(
            "applicable",
            True,
        )
    ]

    if not active_components:
        return 0

    total_weight = sum(
        float(
            component.get(
                "weight",
                0,
            )
        )
        for component
        in active_components
    )

    if total_weight <= 0:
        return 0

    weighted_total = sum(
        float(
            component.get(
                "value",
                0,
            )
            or 0
        )
        * float(
            component.get(
                "weight",
                0,
            )
        )
        for component
        in active_components
    )

    return round(
        weighted_total
        / total_weight,
        1,
    )


def calculate_health_score(
    ore,
    waste,
    fleet,
    plant,
    safety_score,
    operation_profile="standard_mine",
    quality_score=None,
    health_weights=None,
):
    """
    Calculate Mine Health Score based on operation profile.

    Profiles:

    standard_mine
        Oyu Tolgoi style operation:
        - Production
        - Waste
        - Fleet
        - Plant
        - Safety

    sxew_copper
        Achit-Ikht style copper cathode operation:
        - Cathode Production
        - Process Plant
        - Safety

        Waste and Fleet are excluded as N/A.
    """

    operation_profile = (
        str(
            operation_profile
            or "standard_mine"
        )
        .strip()
        .lower()
    )

    # ========================================================
    # ACHIT-IKHT / SX-EW COPPER PROFILE
    # ========================================================

    if operation_profile in {
        "sxew_copper",
        "sx-ew",
        "processing plant / sx-ew",
        "hydrometallurgical copper processing",
    }:
        return calculate_weighted_score(
            [
                {
                    "value": ore,
                    "weight": 0.40,
                    "applicable": True,
                },
                {
                    "value": plant,
                    "weight": 0.40,
                    "applicable": True,
                },
                {
                    "value": safety_score,
                    "weight": 0.20,
                    "applicable": True,
                },
            ]
        )

    if health_weights:
        values = {"production": ore, "waste": waste, "fleet": fleet,
                  "plant": plant, "safety": safety_score,
                  "coal_quality": quality_score}
        return calculate_weighted_score([
            {"value": values.get(key), "weight": weight,
             "applicable": values.get(key) is not None}
            for key, weight in health_weights.items()
        ])

    if operation_profile == "coal_surface_v1":
        return calculate_weighted_score([
            {"value": ore, "weight": .30}, {"value": fleet, "weight": .20},
            {"value": plant, "weight": .20}, {"value": safety_score, "weight": .20},
            {"value": quality_score, "weight": .10, "applicable": quality_score is not None},
        ])

    # Backwards-compatible standard-mine weights.
    return calculate_weighted_score([
            {
                "value": ore,
                "weight": 0.30,
                "applicable": True,
            },
            {
                "value": waste,
                "weight": 0.10,
                "applicable": True,
            },
            {
                "value": fleet,
                "weight": 0.20,
                "applicable": True,
            },
            {
                "value": plant,
                "weight": 0.25,
                "applicable": True,
            },
            {
                "value": safety_score,
                "weight": 0.15,
                "applicable": True,
            },
        ])
