from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


def empty_live_kpi_summary(
    *,
    company_id: int,
    mine_id: int,
    mine_name: str,
    operation_profile: str = "standard_mine",
) -> dict:
    """
    Return an empty tenant-aware live KPI response.
    """

    normalized_operation_profile = str(
        operation_profile
        or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

    return {
        "company_id": company_id,
        "mine_id": mine_id,
        "mine_name": mine_name,
        "operation_profile":
            normalized_operation_profile,

        "report_date": None,

        "health": 0,

        "ore": 0,
        "waste": 0,

        "fleet": 0,
        "availability": 0,
        "utilization": 0,

        "plant": 0,
        "throughput": 0,
        "recovery": 0,

        "safety": 0,
        "safety_score": 0,
        "near_misses": 0,
        "critical_risks": 0,

        "production_label": (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        ),

        "waste_applicable":
            not is_sxew,

        "fleet_applicable":
            not is_sxew,

        "status":
            "No production data",
    }


def get_live_kpi_summary(
    db: Session,
    *,
    company_id: int,
    mine_id: int,
    mine_name: str,
    operation_profile: str = "standard_mine",
) -> dict:
    """
    Return the latest operational KPI summary for the
    authenticated tenant.

    Tenant boundary:
        company_id + mine_id

    mine_name is retained only for display/context.

    SX-EW behavior:
        - production remains applicable
        - waste is not applicable
        - fleet is not applicable
        - plant remains applicable
        - safety remains applicable
    """

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

    if not normalized_mine_name:
        raise ValueError(
            "mine_name is required"
        )

    if company_id is None:
        raise ValueError(
            "company_id is required"
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required"
        )

    normalized_operation_profile = str(
        operation_profile
        or "standard_mine"
    ).strip().lower()

    is_sxew = (
        normalized_operation_profile
        == "sxew_copper"
    )

    tenant_params = {
        "company_id": int(
            company_id
        ),
        "mine_id": int(
            mine_id
        ),
    }

    # ========================================================
    # PRODUCTION
    # ========================================================

    production = (
        db.execute(
            text(
                """
                SELECT *
                FROM public.production_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT 1
                """
            ),
            tenant_params,
        )
        .mappings()
        .first()
    )

    if production is None:
        return empty_live_kpi_summary(
            company_id=int(
                company_id
            ),
            mine_id=int(
                mine_id
            ),
            mine_name=(
                normalized_mine_name
            ),
            operation_profile=(
                normalized_operation_profile
            ),
        )

    ore = safe_percentage(
        production[
            "ore_actual"
        ],
        production[
            "ore_plan"
        ],
    )

    if is_sxew:
        waste = 0

    else:
        waste = safe_percentage(
            production[
                "waste_actual"
            ],
            production[
                "waste_plan"
            ],
        )

    # ========================================================
    # FLEET
    # ========================================================

    if is_sxew:
        fleet_result = None
        availability = 0
        utilization = 0
        fleet = 0

    else:
        fleet_result = (
            db.execute(
                text(
                    """
                    SELECT *
                    FROM public.fleet_daily
                    WHERE company_id = :company_id
                      AND mine_id = :mine_id
                    ORDER BY report_date DESC
                    LIMIT 1
                    """
                ),
                tenant_params,
            )
            .mappings()
            .first()
        )

        if fleet_result:
            availability = float(
                fleet_result[
                    "availability"
                ]
                or 0
            )

            utilization = float(
                fleet_result[
                    "utilization"
                ]
                or 0
            )

            fleet = (
                calculate_fleet_score(
                    availability,
                    utilization,
                )
            )

        else:
            availability = 0
            utilization = 0
            fleet = 0

    # ========================================================
    # PLANT
    # ========================================================

    plant_result = (
        db.execute(
            text(
                """
                SELECT *
                FROM public.plant_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT 1
                """
            ),
            tenant_params,
        )
        .mappings()
        .first()
    )

    if plant_result:
        (
            plant,
            throughput,
            recovery,
        ) = calculate_plant_score(
            plant_result[
                "throughput_actual"
            ],
            plant_result[
                "throughput_plan"
            ],
            plant_result[
                "recovery"
            ],
        )

    else:
        plant = 0
        throughput = 0
        recovery = 0

    # ========================================================
    # SAFETY
    # ========================================================

    safety_result = (
        db.execute(
            text(
                """
                SELECT *
                FROM public.safety_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT 1
                """
            ),
            tenant_params,
        )
        .mappings()
        .first()
    )

    if safety_result:
        incidents = int(
            safety_result[
                "incidents"
            ]
            or 0
        )

        near_misses = int(
            safety_result[
                "near_misses"
            ]
            or 0
        )

        critical_risks = int(
            safety_result[
                "critical_risks"
            ]
            or 0
        )

        safety_score = float(
            safety_result[
                "safety_score"
            ]
            or 0
        )

    else:
        incidents = 0
        near_misses = 0
        critical_risks = 0
        safety_score = 0

    # ========================================================
    # MINE HEALTH
    # ========================================================

    if is_sxew:
        # SX-EW excludes waste and fleet from Mine Health.
        health_components = [
            ore,
            plant,
            safety_score,
        ]

        valid_components = [
            float(value)
            for value
            in health_components
            if value is not None
        ]

        health = (
            round(
                sum(
                    valid_components
                )
                / len(
                    valid_components
                ),
                1,
            )
            if valid_components
            else 0
        )

    else:
        health = (
            calculate_health_score(
                ore=ore,
                waste=waste,
                fleet=fleet,
                plant=plant,
                safety_score=(
                    safety_score
                ),
            )
        )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "company_id":
            int(
                company_id
            ),

        "mine_id":
            int(
                mine_id
            ),

        "mine_name":
            normalized_mine_name,

        "operation_profile":
            normalized_operation_profile,

        "report_date":
            str(
                production[
                    "report_date"
                ]
            ),

        "health":
            health,

        "ore":
            ore,

        "waste":
            waste,

        "fleet":
            fleet,

        "availability":
            availability,

        "utilization":
            utilization,

        "plant":
            plant,

        "throughput":
            throughput,

        "recovery":
            recovery,

        "safety":
            incidents,

        "safety_score":
            safety_score,

        "near_misses":
            near_misses,

        "critical_risks":
            critical_risks,

        "production_label": (
            "Cathode Production"
            if is_sxew
            else "Ore Production"
        ),

        "waste_applicable":
            not is_sxew,

        "fleet_applicable":
            not is_sxew,

        "status":
            "Connected to PostgreSQL",
    }