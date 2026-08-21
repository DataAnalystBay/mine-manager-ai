from collections import defaultdict
from datetime import date
from typing import Any, Dict, List

from sqlalchemy import text

from app.database import SessionLocal


# ============================================================
# Tenant Resolution
# ============================================================

def resolve_demo_tenant(
    db,
    mine_name: str,
) -> Dict[str, Any]:
    """
    Resolve the requested Demo Mode mine/company to the
    tenant identifiers used by operational tables.

    Primary lookup:
        public.mine_settings.mine_name

    Fallback:
        public.company_settings.company_name

    This allows a request such as "Achit Ikht LLC" to work
    even when the configured mine/operation has a different
    display name.
    """

    normalized_name = str(
        mine_name or ""
    ).strip()

    if not normalized_name:
        raise ValueError(
            "mine_name is required."
        )

    tenant = db.execute(
        text(
            """
            SELECT
                m.id AS mine_id,
                m.company_id AS company_id,
                m.mine_name AS mine_name,
                c.company_name AS company_name
            FROM public.mine_settings AS m
            JOIN public.company_settings AS c
                ON c.id = m.company_id
            WHERE
                LOWER(m.mine_name) = LOWER(:name)
                OR LOWER(c.company_name) = LOWER(:name)
            ORDER BY
                CASE
                    WHEN LOWER(m.mine_name) = LOWER(:name)
                    THEN 0
                    ELSE 1
                END,
                m.id
            LIMIT 1
            """
        ),
        {
            "name": normalized_name,
        },
    ).mappings().first()

    if tenant is None:
        raise ValueError(
            "Configured mine/company not found: "
            f"{normalized_name}"
        )

    return {
        "company_id":
            int(
                tenant["company_id"]
            ),

        "mine_id":
            int(
                tenant["mine_id"]
            ),

        "company_name":
            str(
                tenant["company_name"]
            ),

        "mine_name":
            str(
                tenant["mine_name"]
            ),
    }


# ============================================================
# Helpers
# ============================================================

def _to_date(
    value: Any,
) -> date:
    """
    Convert ISO date strings to Python date objects.
    """

    if isinstance(
        value,
        date,
    ):
        return value

    return date.fromisoformat(
        str(value)
    )


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        return float(value)
    except (
        TypeError,
        ValueError,
    ):
        return default


def _safe_int(
    value: Any,
    default: int = 0,
) -> int:
    try:
        return int(value)
    except (
        TypeError,
        ValueError,
    ):
        return default


# ============================================================
# Fleet Aggregation
# ============================================================

def aggregate_fleet_by_date(
    fleet_records: List[
        Dict[str, Any]
    ],
) -> List[Dict[str, Any]]:
    """
    The synthetic generator contains multiple equipment
    records per day.

    public.fleet_daily supports one row per:

        company_id + mine_id + report_date

    Therefore equipment-level records are aggregated into
    one daily fleet KPI row using average availability and
    utilization.
    """

    grouped = defaultdict(list)

    for record in fleet_records:
        report_date = _to_date(
            record["report_date"]
        )

        grouped[
            report_date
        ].append(
            record
        )

    aggregated = []

    for report_date in sorted(
        grouped.keys()
    ):
        records = grouped[
            report_date
        ]

        availability_values = [
            _safe_float(
                item.get(
                    "availability"
                )
            )
            for item in records
        ]

        utilization_values = [
            _safe_float(
                item.get(
                    "utilization"
                )
            )
            for item in records
        ]

        availability = (
            sum(
                availability_values
            )
            / len(
                availability_values
            )
            if availability_values
            else 0.0
        )

        utilization = (
            sum(
                utilization_values
            )
            / len(
                utilization_values
            )
            if utilization_values
            else 0.0
        )

        aggregated.append(
            {
                "report_date":
                    report_date,

                "availability":
                    round(
                        availability,
                        1,
                    ),

                "utilization":
                    round(
                        utilization,
                        1,
                    ),
            }
        )

    return aggregated


# ============================================================
# Safety Conversion
# ============================================================

def _calculate_safety_score(
    incidents: int,
    near_misses: int,
    critical_risks: int,
) -> float:
    """
    Produce a simple synthetic composite safety score.

    This is Demo Mode logic only.

    The score is intentionally conservative when:
        - an incident occurs
        - critical risks are open
        - near misses increase
    """

    score = 100.0

    score -= (
        incidents
        * 25.0
    )

    score -= (
        critical_risks
        * 10.0
    )

    score -= min(
        near_misses
        * 2.0,
        10.0,
    )

    return round(
        max(
            0.0,
            min(
                100.0,
                score,
            ),
        ),
        1,
    )


# ============================================================
# Production Persistence
# ============================================================

def _persist_production(
    db,
    tenant: Dict[str, Any],
    records: List[Dict[str, Any]],
) -> Dict[str, int]:

    inserted = 0
    updated = 0

    statement = text(
        """
        INSERT INTO public.production_daily
        (
            company_id,
            mine_id,
            mine_name,
            report_date,
            ore_plan,
            ore_actual,
            waste_plan,
            waste_actual
        )
        VALUES
        (
            :company_id,
            :mine_id,
            :mine_name,
            :report_date,
            :ore_plan,
            :ore_actual,
            :waste_plan,
            :waste_actual
        )
        ON CONFLICT
            (
                company_id,
                mine_id,
                report_date
            )
        DO UPDATE SET
            mine_name =
                EXCLUDED.mine_name,

            ore_plan =
                EXCLUDED.ore_plan,

            ore_actual =
                EXCLUDED.ore_actual,

            waste_plan =
                EXCLUDED.waste_plan,

            waste_actual =
                EXCLUDED.waste_actual,

            created_at =
                CURRENT_TIMESTAMP

        RETURNING
            (xmax = 0)
            AS inserted
        """
    )

    for record in records:
        result = db.execute(
            statement,
            {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],

                "mine_name":
                    tenant[
                        "mine_name"
                    ],

                "report_date":
                    _to_date(
                        record[
                            "report_date"
                        ]
                    ),

                "ore_plan":
                    _safe_float(
                        record.get(
                            "ore_plan"
                        )
                    ),

                "ore_actual":
                    _safe_float(
                        record.get(
                            "ore_actual"
                        )
                    ),

                "waste_plan":
                    _safe_float(
                        record.get(
                            "waste_plan"
                        )
                    ),

                "waste_actual":
                    _safe_float(
                        record.get(
                            "waste_actual"
                        )
                    ),
            },
        ).scalar_one()

        if result:
            inserted += 1
        else:
            updated += 1

    return {
        "inserted":
            inserted,

        "updated":
            updated,
    }


# ============================================================
# Plant Persistence
# ============================================================

def _persist_plant(
    db,
    tenant: Dict[str, Any],
    records: List[Dict[str, Any]],
) -> Dict[str, int]:

    inserted = 0
    updated = 0

    statement = text(
        """
        INSERT INTO public.plant_daily
        (
            company_id,
            mine_id,
            mine_name,
            report_date,
            throughput_plan,
            throughput_actual,
            recovery
        )
        VALUES
        (
            :company_id,
            :mine_id,
            :mine_name,
            :report_date,
            :throughput_plan,
            :throughput_actual,
            :recovery
        )
        ON CONFLICT
            (
                company_id,
                mine_id,
                report_date
            )
        DO UPDATE SET
            mine_name =
                EXCLUDED.mine_name,

            throughput_plan =
                EXCLUDED.throughput_plan,

            throughput_actual =
                EXCLUDED.throughput_actual,

            recovery =
                EXCLUDED.recovery,

            created_at =
                CURRENT_TIMESTAMP

        RETURNING
            (xmax = 0)
            AS inserted
        """
    )

    for record in records:
        result = db.execute(
            statement,
            {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],

                "mine_name":
                    tenant[
                        "mine_name"
                    ],

                "report_date":
                    _to_date(
                        record[
                            "report_date"
                        ]
                    ),

                "throughput_plan":
                    _safe_float(
                        record.get(
                            "throughput_plan"
                        )
                    ),

                "throughput_actual":
                    _safe_float(
                        record.get(
                            "throughput_actual"
                        )
                    ),

                "recovery":
                    _safe_float(
                        record.get(
                            "recovery"
                        )
                    ),
            },
        ).scalar_one()

        if result:
            inserted += 1
        else:
            updated += 1

    return {
        "inserted":
            inserted,

        "updated":
            updated,
    }


# ============================================================
# Fleet Persistence
# ============================================================

def _persist_fleet(
    db,
    tenant: Dict[str, Any],
    records: List[Dict[str, Any]],
) -> Dict[str, int]:

    inserted = 0
    updated = 0

    daily_records = (
        aggregate_fleet_by_date(
            records
        )
    )

    statement = text(
        """
        INSERT INTO public.fleet_daily
        (
            company_id,
            mine_id,
            mine_name,
            report_date,
            availability,
            utilization
        )
        VALUES
        (
            :company_id,
            :mine_id,
            :mine_name,
            :report_date,
            :availability,
            :utilization
        )
        ON CONFLICT
            (
                company_id,
                mine_id,
                report_date
            )
        DO UPDATE SET
            mine_name =
                EXCLUDED.mine_name,

            availability =
                EXCLUDED.availability,

            utilization =
                EXCLUDED.utilization,

            created_at =
                CURRENT_TIMESTAMP

        RETURNING
            (xmax = 0)
            AS inserted
        """
    )

    for record in daily_records:
        result = db.execute(
            statement,
            {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],

                "mine_name":
                    tenant[
                        "mine_name"
                    ],

                "report_date":
                    record[
                        "report_date"
                    ],

                "availability":
                    _safe_float(
                        record.get(
                            "availability"
                        )
                    ),

                "utilization":
                    _safe_float(
                        record.get(
                            "utilization"
                        )
                    ),
            },
        ).scalar_one()

        if result:
            inserted += 1
        else:
            updated += 1

    return {
        "inserted":
            inserted,

        "updated":
            updated,

        "source_records":
            len(
                records
            ),

        "daily_records":
            len(
                daily_records
            ),
    }


# ============================================================
# Safety Persistence
# ============================================================

def _persist_safety(
    db,
    tenant: Dict[str, Any],
    records: List[Dict[str, Any]],
) -> Dict[str, int]:

    inserted = 0
    updated = 0

    statement = text(
        """
        INSERT INTO public.safety_daily
        (
            company_id,
            mine_id,
            mine_name,
            report_date,
            incidents,
            near_misses,
            critical_risks,
            safety_score
        )
        VALUES
        (
            :company_id,
            :mine_id,
            :mine_name,
            :report_date,
            :incidents,
            :near_misses,
            :critical_risks,
            :safety_score
        )
        ON CONFLICT
            (
                company_id,
                mine_id,
                report_date
            )
        DO UPDATE SET
            mine_name =
                EXCLUDED.mine_name,

            incidents =
                EXCLUDED.incidents,

            near_misses =
                EXCLUDED.near_misses,

            critical_risks =
                EXCLUDED.critical_risks,

            safety_score =
                EXCLUDED.safety_score,

            created_at =
                CURRENT_TIMESTAMP

        RETURNING
            (xmax = 0)
            AS inserted
        """
    )

    for record in records:
        incidents = _safe_int(
            record.get(
                "recordable_incidents",
                record.get(
                    "incidents",
                    0,
                ),
            )
        )

        near_misses = _safe_int(
            record.get(
                "near_misses",
                0,
            )
        )

        critical_risks = _safe_int(
            record.get(
                "critical_risks",
                0,
            )
        )

        safety_score = (
            _calculate_safety_score(
                incidents=incidents,
                near_misses=near_misses,
                critical_risks=critical_risks,
            )
        )

        result = db.execute(
            statement,
            {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],

                "mine_name":
                    tenant[
                        "mine_name"
                    ],

                "report_date":
                    _to_date(
                        record[
                            "report_date"
                        ]
                    ),

                "incidents":
                    incidents,

                "near_misses":
                    near_misses,

                "critical_risks":
                    critical_risks,

                "safety_score":
                    safety_score,
            },
        ).scalar_one()

        if result:
            inserted += 1
        else:
            updated += 1

    return {
        "inserted":
            inserted,

        "updated":
            updated,
    }


# ============================================================
# Public Persistence Function
# ============================================================

def persist_demo_data(
    demo_data: Dict[str, Any],
    mine_name: str,
) -> Dict[str, Any]:
    """
    Persist generated Demo Mode history into the current
    tenant-aware operational tables.

    The operation is transactional:
    either all four datasets are committed or none are.

    Current persisted domains:
        Production
        Plant
        Fleet
        Safety

    Maintenance and Workforce remain generated in memory
    because no corresponding tenant-aware public operational
    tables currently exist.
    """

    db = SessionLocal()

    try:
        tenant = (
            resolve_demo_tenant(
                db=db,
                mine_name=mine_name,
            )
        )

        production_result = (
            _persist_production(
                db=db,
                tenant=tenant,
                records=demo_data.get(
                    "production",
                    [],
                ),
            )
        )

        plant_result = (
            _persist_plant(
                db=db,
                tenant=tenant,
                records=demo_data.get(
                    "plant",
                    [],
                ),
            )
        )

        fleet_result = (
            _persist_fleet(
                db=db,
                tenant=tenant,
                records=demo_data.get(
                    "fleet",
                    [],
                ),
            )
        )

        safety_result = (
            _persist_safety(
                db=db,
                tenant=tenant,
                records=demo_data.get(
                    "safety",
                    [],
                ),
            )
        )

        db.commit()

        return {
            "success":
                True,

            "tenant": {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "company_name":
                    tenant[
                        "company_name"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],

                "mine_name":
                    tenant[
                        "mine_name"
                    ],
            },

            "production":
                production_result,

            "plant":
                plant_result,

            "fleet":
                fleet_result,

            "safety":
                safety_result,

            "maintenance_persisted":
                False,

            "workforce_persisted":
                False,
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()