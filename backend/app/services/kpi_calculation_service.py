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

    # ========================================================
    # STANDARD MINE PROFILE
    # ========================================================

    return calculate_weighted_score(
        [
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
        ]
    )