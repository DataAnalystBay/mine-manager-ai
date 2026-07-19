def safe_percentage(actual, plan):
    actual = float(actual or 0)
    plan = float(plan or 0)

    if plan <= 0:
        return 0

    return round((actual / plan) * 100, 1)


def calculate_fleet_score(availability, utilization):
    availability = float(availability or 0)
    utilization = float(utilization or 0)

    return round((availability + utilization) / 2, 1)


def calculate_plant_score(throughput_actual, throughput_plan, recovery):
    throughput = safe_percentage(throughput_actual, throughput_plan)
    recovery = float(recovery or 0)

    plant = round(
        throughput * 0.6 +
        recovery * 0.4,
        1
    )

    return plant, throughput, recovery


def calculate_health_score(
    ore,
    waste,
    fleet,
    plant,
    safety_score
):
    return round(
        ore * 0.30 +
        waste * 0.10 +
        fleet * 0.20 +
        plant * 0.25 +
        safety_score * 0.15,
        1
    )