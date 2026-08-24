from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.kpi_calculation_service import (
    safe_percentage,
    calculate_fleet_score,
    calculate_plant_score,
    calculate_health_score,
)


SXEW_OPERATION_PROFILES = {
    "sxew",
    "sx_ew",
    "sx-ew",
    "sxew_copper",
    "copper_sxew",
    "copper_cathode",
}


def _normalize_operation_profile(
    operation_profile: str,
) -> str:
    """
    Normalize the configured operation profile into a stable
    internal value.
    """

    normalized = str(
        operation_profile or "standard_mine"
    ).strip().lower()

    normalized = (
        normalized
        .replace("-", "_")
        .replace(" ", "_")
    )

    if normalized in SXEW_OPERATION_PROFILES:
        return "sxew_copper"

    return normalized or "standard_mine"


def _is_sxew_operation(
    operation_profile: str,
) -> bool:
    """
    Return True when the tenant represents an SX-EW /
    copper-cathode processing operation.
    """

    return (
        _normalize_operation_profile(
            operation_profile
        )
        == "sxew_copper"
    )


def _calculate_profile_health(
    *,
    ore: float,
    waste: float,
    fleet: float,
    plant: float,
    safety_score: float,
    operation_profile: str,
) -> float:
    """
    Calculate Mine Health using only KPIs applicable to the
    authenticated tenant's operation profile.

    Standard mine:
        Production + Waste + Fleet + Plant + Safety.

    SX-EW:
        Cathode Production + Plant + Safety.

    Waste movement and mining fleet are intentionally excluded
    from SX-EW health because they are not applicable operational
    dimensions for the current Achit-Ikht configuration.
    """

    if _is_sxew_operation(
        operation_profile
    ):
        applicable_scores = [
            float(ore or 0),
            float(plant or 0),
            float(safety_score or 0),
        ]

        return round(
            sum(applicable_scores)
            / len(applicable_scores),
            1,
        )

    return calculate_health_score(
        ore=ore,
        waste=waste,
        fleet=fleet,
        plant=plant,
        safety_score=safety_score,
    )


def _empty_monthly_kpi_summary(
    *,
    company_id: int,
    mine_id: int,
    mine_name: str,
    operation_profile: str,
) -> dict:
    """
    Return a stable empty response when the tenant has no
    production data.
    """

    normalized_operation_profile = (
        _normalize_operation_profile(
            operation_profile
        )
    )

    sxew_operation = _is_sxew_operation(
        normalized_operation_profile
    )

    return {
        "company_id": int(company_id),
        "mine_id": int(mine_id),
        "mine_name": mine_name,
        "operation_profile":
            normalized_operation_profile,
        "report_date": None,
        "period_start": None,
        "period_end": None,
        "health": 0,
        "ore": 0,
        "waste": 0,
        "ore_plan": 0,
        "ore_actual": 0,
        "waste_plan": 0,
        "waste_actual": 0,
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
            if sxew_operation
            else "Ore Production"
        ),
        "waste_applicable":
            not sxew_operation,
        "fleet_applicable":
            not sxew_operation,
        "days": [],
        "status": "No production data",
    }


def get_monthly_kpi_summary(
    db: Session,
    company_id: int,
    mine_id: int,
    mine_name: str,
    operation_profile: str = "standard_mine",
    days: int = 30,
) -> dict:
    """
    Return live KPI history and aggregated monthly metrics
    for the authenticated tenant.

    Tenant isolation:
        company_id + mine_id are the authoritative database
        ownership filters.

    mine_name:
        Retained for display/context only. It is not used as
        the database tenant boundary.

    Operation profiles:
        standard_mine
            Ore + Waste + Fleet + Plant + Safety

        sxew_copper
            Cathode Production + Plant + Safety

            Waste and mining fleet are not applicable to the
            current SX-EW operating model.
    """

    if company_id is None:
        raise ValueError(
            "company_id is required"
        )

    if mine_id is None:
        raise ValueError(
            "mine_id is required"
        )

    normalized_mine_name = str(
        mine_name or ""
    ).strip()

    if not normalized_mine_name:
        raise ValueError(
            "mine_name is required"
        )

    try:
        normalized_days = int(days)
    except (TypeError, ValueError):
        normalized_days = 30

    normalized_days = max(
        1,
        min(normalized_days, 366),
    )

    normalized_operation_profile = (
        _normalize_operation_profile(
            operation_profile
        )
    )

    sxew_operation = _is_sxew_operation(
        normalized_operation_profile
    )

    tenant_params = {
        "company_id": int(company_id),
        "mine_id": int(mine_id),
        "days": normalized_days,
    }

    # --------------------------------------------------
    # Production
    # --------------------------------------------------

    production_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                ore_plan,
                ore_actual,
                waste_plan,
                waste_actual
            FROM production_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        tenant_params,
    ).mappings().all()

    if not production_rows:
        return _empty_monthly_kpi_summary(
            company_id=int(company_id),
            mine_id=int(mine_id),
            mine_name=normalized_mine_name,
            operation_profile=(
                normalized_operation_profile
            ),
        )

    production_rows = list(
        reversed(production_rows)
    )

    # --------------------------------------------------
    # Fleet
    # --------------------------------------------------

    # Fleet is not an applicable KPI dimension for the
    # current SX-EW profile. We therefore avoid querying
    # fleet data for SX-EW tenants.
    if sxew_operation:
        fleet_rows = []
    else:
        fleet_rows = db.execute(
            text(
                """
                SELECT
                    report_date,
                    availability,
                    utilization
                FROM fleet_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT :days
                """
            ),
            tenant_params,
        ).mappings().all()

        fleet_rows = list(
            reversed(fleet_rows)
        )

    # --------------------------------------------------
    # Plant
    # --------------------------------------------------

    plant_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                throughput_plan,
                throughput_actual,
                recovery
            FROM plant_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        tenant_params,
    ).mappings().all()

    plant_rows = list(
        reversed(plant_rows)
    )

    # --------------------------------------------------
    # Safety
    # --------------------------------------------------

    safety_rows = db.execute(
        text(
            """
            SELECT
                report_date,
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM safety_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT :days
            """
        ),
        tenant_params,
    ).mappings().all()

    safety_rows = list(
        reversed(safety_rows)
    )

    # --------------------------------------------------
    # Index supporting datasets by date
    # --------------------------------------------------

    fleet_by_date = {
        str(row["report_date"]): row
        for row in fleet_rows
    }

    plant_by_date = {
        str(row["report_date"]): row
        for row in plant_rows
    }

    safety_by_date = {
        str(row["report_date"]): row
        for row in safety_rows
    }

    # --------------------------------------------------
    # Build daily monthly-history records
    # --------------------------------------------------

    daily_results: List[
        Dict[str, Any]
    ] = []

    total_ore_plan = 0.0
    total_ore_actual = 0.0
    total_waste_plan = 0.0
    total_waste_actual = 0.0

    for production in production_rows:
        report_date = str(
            production["report_date"]
        )

        ore_plan = float(
            production["ore_plan"] or 0
        )

        ore_actual = float(
            production["ore_actual"] or 0
        )

        # In the current shared production table, the ore
        # fields represent the primary production measure.
        # For SX-EW this is interpreted as cathode production.
        total_ore_plan += ore_plan
        total_ore_actual += ore_actual

        ore = safe_percentage(
            ore_actual,
            ore_plan,
        )

        # --------------------------------------------------
        # Waste
        # --------------------------------------------------

        if sxew_operation:
            waste_plan = 0.0
            waste_actual = 0.0
            waste = 0.0
        else:
            waste_plan = float(
                production[
                    "waste_plan"
                ] or 0
            )

            waste_actual = float(
                production[
                    "waste_actual"
                ] or 0
            )

            total_waste_plan += (
                waste_plan
            )

            total_waste_actual += (
                waste_actual
            )

            waste = safe_percentage(
                waste_actual,
                waste_plan,
            )

        # --------------------------------------------------
        # Fleet
        # --------------------------------------------------

        if sxew_operation:
            availability = 0.0
            utilization = 0.0
            fleet = 0.0
        else:
            fleet_row = (
                fleet_by_date.get(
                    report_date
                )
            )

            if fleet_row:
                availability = float(
                    fleet_row[
                        "availability"
                    ] or 0
                )

                utilization = float(
                    fleet_row[
                        "utilization"
                    ] or 0
                )

                fleet = (
                    calculate_fleet_score(
                        availability,
                        utilization,
                    )
                )
            else:
                availability = 0.0
                utilization = 0.0
                fleet = 0.0

        # --------------------------------------------------
        # Plant
        # --------------------------------------------------

        plant_row = plant_by_date.get(
            report_date
        )

        if plant_row:
            (
                plant,
                throughput,
                recovery,
            ) = calculate_plant_score(
                plant_row[
                    "throughput_actual"
                ],
                plant_row[
                    "throughput_plan"
                ],
                plant_row[
                    "recovery"
                ],
            )
        else:
            plant = 0.0
            throughput = 0.0
            recovery = 0.0

        # --------------------------------------------------
        # Safety
        # --------------------------------------------------

        safety_row = safety_by_date.get(
            report_date
        )

        if safety_row:
            incidents = int(
                safety_row[
                    "incidents"
                ] or 0
            )

            near_misses = int(
                safety_row[
                    "near_misses"
                ] or 0
            )

            critical_risks = int(
                safety_row[
                    "critical_risks"
                ] or 0
            )

            safety_score = float(
                safety_row[
                    "safety_score"
                ] or 0
            )
        else:
            incidents = 0
            near_misses = 0
            critical_risks = 0
            safety_score = 0.0

        # --------------------------------------------------
        # Mine Health
        # --------------------------------------------------

        health = (
            _calculate_profile_health(
                ore=ore,
                waste=waste,
                fleet=fleet,
                plant=plant,
                safety_score=safety_score,
                operation_profile=(
                    normalized_operation_profile
                ),
            )
        )

        daily_results.append(
            {
                "report_date":
                    report_date,

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

                "health":
                    health,

                "production_label": (
                    "Cathode Production"
                    if sxew_operation
                    else "Ore Production"
                ),

                "waste_applicable":
                    not sxew_operation,

                "fleet_applicable":
                    not sxew_operation,
            }
        )

    # --------------------------------------------------
    # Aggregate monthly metrics
    # --------------------------------------------------

    count = len(
        daily_results
    )

    def average(
        key: str,
    ) -> float:
        if count == 0:
            return 0.0

        return round(
            sum(
                float(
                    item.get(
                        key,
                        0,
                    )
                    or 0
                )
                for item in daily_results
            )
            / count,
            1,
        )

    ore_achievement = safe_percentage(
        total_ore_actual,
        total_ore_plan,
    )

    if sxew_operation:
        waste_achievement = 0.0
    else:
        waste_achievement = (
            safe_percentage(
                total_waste_actual,
                total_waste_plan,
            )
        )

    # --------------------------------------------------
    # Final response
    # --------------------------------------------------

    return {
        "company_id":
            int(company_id),

        "mine_id":
            int(mine_id),

        "mine_name":
            normalized_mine_name,

        "operation_profile":
            normalized_operation_profile,

        "report_date": (
            daily_results[-1][
                "report_date"
            ]
        ),

        "period_start": (
            daily_results[0][
                "report_date"
            ]
        ),

        "period_end": (
            daily_results[-1][
                "report_date"
            ]
        ),

        "health":
            average(
                "health"
            ),

        "ore":
            ore_achievement,

        "waste":
            waste_achievement,

        "ore_plan":
            round(
                total_ore_plan,
                1,
            ),

        "ore_actual":
            round(
                total_ore_actual,
                1,
            ),

        "waste_plan":
            round(
                total_waste_plan,
                1,
            ),

        "waste_actual":
            round(
                total_waste_actual,
                1,
            ),

        "fleet":
            (
                0.0
                if sxew_operation
                else average(
                    "fleet"
                )
            ),

        "availability":
            (
                0.0
                if sxew_operation
                else average(
                    "availability"
                )
            ),

        "utilization":
            (
                0.0
                if sxew_operation
                else average(
                    "utilization"
                )
            ),

        "plant":
            average(
                "plant"
            ),

        "throughput":
            average(
                "throughput"
            ),

        "recovery":
            average(
                "recovery"
            ),

        "safety":
            sum(
                int(
                    item[
                        "safety"
                    ]
                )
                for item
                in daily_results
            ),

        "safety_score":
            average(
                "safety_score"
            ),

        "near_misses":
            sum(
                int(
                    item[
                        "near_misses"
                    ]
                )
                for item
                in daily_results
            ),

        "critical_risks":
            sum(
                int(
                    item[
                        "critical_risks"
                    ]
                )
                for item
                in daily_results
            ),

        "production_label": (
            "Cathode Production"
            if sxew_operation
            else "Ore Production"
        ),

        "waste_applicable":
            not sxew_operation,

        "fleet_applicable":
            not sxew_operation,

        "days":
            daily_results,

        "status":
            "Connected to PostgreSQL",
    }