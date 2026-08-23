from collections import defaultdict
from datetime import date
from io import StringIO
from time import perf_counter
from typing import Any, Dict, List
import csv

from sqlalchemy import text

from app.database import (
    SessionLocal,
    engine,
)


# ============================================================
# Tenant Resolution
# ============================================================

def resolve_demo_tenant(
    db,
    mine_name: str,
) -> Dict[str, Any]:
    """
    Resolve a configured mine or company into the immutable
    tenant IDs used by public operational tables.

    Supports:
        public.mine_settings.mine_name
        public.company_settings.company_name
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
    Convert ISO date strings to Python date values.
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


def _create_csv_buffer(
    rows: List[List[Any]],
) -> StringIO:
    """
    Convert rows into an in-memory CSV file that psycopg2
    COPY can stream directly into PostgreSQL.
    """

    buffer = StringIO()

    writer = csv.writer(
        buffer,
        lineterminator="\n",
    )

    for row in rows:
        writer.writerow(
            [
                (
                    value.isoformat()
                    if isinstance(
                        value,
                        date,
                    )
                    else value
                )
                for value in row
            ]
        )

    buffer.seek(0)

    return buffer


# ============================================================
# Fleet Aggregation
# ============================================================

def aggregate_fleet_by_date(
    fleet_records: List[
        Dict[str, Any]
    ],
) -> List[Dict[str, Any]]:
    """
    Convert truck/equipment-level synthetic records into
    one daily Fleet record.

    public.fleet_daily supports one row for:

        company_id + mine_id + report_date
    """

    grouped = defaultdict(
        list
    )

    for record in fleet_records:
        report_date = _to_date(
            record[
                "report_date"
            ]
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
# Safety Score
# ============================================================

def _calculate_safety_score(
    incidents: int,
    near_misses: int,
    critical_risks: int,
) -> float:
    """
    Synthetic Demo Mode safety score.

    This logic is for demonstration only.
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
# Stage Production
# ============================================================

def _copy_production(
    cursor,
    records: List[
        Dict[str, Any]
    ],
) -> Dict[str, Any]:
    """
    COPY Production records into a temporary staging table.
    """

    started = perf_counter()

    cursor.execute(
        """
        CREATE TEMP TABLE
            demo_stage_production
        (
            report_date DATE NOT NULL,
            ore_plan NUMERIC,
            ore_actual NUMERIC,
            waste_plan NUMERIC,
            waste_actual NUMERIC
        )
        ON COMMIT DROP
        """
    )

    rows = [
        [
            _to_date(
                record[
                    "report_date"
                ]
            ),
            _safe_float(
                record.get(
                    "ore_plan"
                )
            ),
            _safe_float(
                record.get(
                    "ore_actual"
                )
            ),
            _safe_float(
                record.get(
                    "waste_plan"
                )
            ),
            _safe_float(
                record.get(
                    "waste_actual"
                )
            ),
        ]
        for record in records
    ]

    buffer = _create_csv_buffer(
        rows
    )

    cursor.copy_expert(
        """
        COPY demo_stage_production
        (
            report_date,
            ore_plan,
            ore_actual,
            waste_plan,
            waste_actual
        )
        FROM STDIN
        WITH
        (
            FORMAT CSV
        )
        """,
        buffer,
    )

    return {
        "staged":
            len(
                rows
            ),

        "copy_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Stage Plant
# ============================================================

def _copy_plant(
    cursor,
    records: List[
        Dict[str, Any]
    ],
) -> Dict[str, Any]:

    started = perf_counter()

    cursor.execute(
        """
        CREATE TEMP TABLE
            demo_stage_plant
        (
            report_date DATE NOT NULL,
            throughput_plan NUMERIC,
            throughput_actual NUMERIC,
            recovery NUMERIC
        )
        ON COMMIT DROP
        """
    )

    rows = [
        [
            _to_date(
                record[
                    "report_date"
                ]
            ),
            _safe_float(
                record.get(
                    "throughput_plan"
                )
            ),
            _safe_float(
                record.get(
                    "throughput_actual"
                )
            ),
            _safe_float(
                record.get(
                    "recovery"
                )
            ),
        ]
        for record in records
    ]

    buffer = _create_csv_buffer(
        rows
    )

    cursor.copy_expert(
        """
        COPY demo_stage_plant
        (
            report_date,
            throughput_plan,
            throughput_actual,
            recovery
        )
        FROM STDIN
        WITH
        (
            FORMAT CSV
        )
        """,
        buffer,
    )

    return {
        "staged":
            len(
                rows
            ),

        "copy_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Stage Fleet
# ============================================================

def _copy_fleet(
    cursor,
    records: List[
        Dict[str, Any]
    ],
) -> Dict[str, Any]:

    started = perf_counter()

    daily_records = (
        aggregate_fleet_by_date(
            records
        )
    )

    cursor.execute(
        """
        CREATE TEMP TABLE
            demo_stage_fleet
        (
            report_date DATE NOT NULL,
            availability NUMERIC,
            utilization NUMERIC
        )
        ON COMMIT DROP
        """
    )

    rows = [
        [
            record[
                "report_date"
            ],
            _safe_float(
                record.get(
                    "availability"
                )
            ),
            _safe_float(
                record.get(
                    "utilization"
                )
            ),
        ]
        for record in daily_records
    ]

    buffer = _create_csv_buffer(
        rows
    )

    cursor.copy_expert(
        """
        COPY demo_stage_fleet
        (
            report_date,
            availability,
            utilization
        )
        FROM STDIN
        WITH
        (
            FORMAT CSV
        )
        """,
        buffer,
    )

    return {
        "source_records":
            len(
                records
            ),

        "staged":
            len(
                rows
            ),

        "copy_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Stage Safety
# ============================================================

def _copy_safety(
    cursor,
    records: List[
        Dict[str, Any]
    ],
) -> Dict[str, Any]:

    started = perf_counter()

    cursor.execute(
        """
        CREATE TEMP TABLE
            demo_stage_safety
        (
            report_date DATE NOT NULL,
            incidents INTEGER,
            near_misses INTEGER,
            critical_risks INTEGER,
            safety_score NUMERIC
        )
        ON COMMIT DROP
        """
    )

    rows = []

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
                incidents=
                    incidents,

                near_misses=
                    near_misses,

                critical_risks=
                    critical_risks,
            )
        )

        rows.append(
            [
                _to_date(
                    record[
                        "report_date"
                    ]
                ),
                incidents,
                near_misses,
                critical_risks,
                safety_score,
            ]
        )

    buffer = _create_csv_buffer(
        rows
    )

    cursor.copy_expert(
        """
        COPY demo_stage_safety
        (
            report_date,
            incidents,
            near_misses,
            critical_risks,
            safety_score
        )
        FROM STDIN
        WITH
        (
            FORMAT CSV
        )
        """,
        buffer,
    )

    return {
        "staged":
            len(
                rows
            ),

        "copy_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Server-Side Production UPSERT
# ============================================================

def _upsert_production(
    cursor,
    tenant: Dict[str, Any],
) -> Dict[str, Any]:

    started = perf_counter()

    cursor.execute(
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
        SELECT
            %s,
            %s,
            %s,
            report_date,
            ore_plan,
            ore_actual,
            waste_plan,
            waste_actual
        FROM demo_stage_production

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
        """,
        (
            tenant[
                "company_id"
            ],
            tenant[
                "mine_id"
            ],
            tenant[
                "mine_name"
            ],
        ),
    )

    return {
        "upserted":
            cursor.rowcount,

        "upsert_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Server-Side Plant UPSERT
# ============================================================

def _upsert_plant(
    cursor,
    tenant: Dict[str, Any],
) -> Dict[str, Any]:

    started = perf_counter()

    cursor.execute(
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
        SELECT
            %s,
            %s,
            %s,
            report_date,
            throughput_plan,
            throughput_actual,
            recovery
        FROM demo_stage_plant

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
        """,
        (
            tenant[
                "company_id"
            ],
            tenant[
                "mine_id"
            ],
            tenant[
                "mine_name"
            ],
        ),
    )

    return {
        "upserted":
            cursor.rowcount,

        "upsert_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Server-Side Fleet UPSERT
# ============================================================

def _upsert_fleet(
    cursor,
    tenant: Dict[str, Any],
) -> Dict[str, Any]:

    started = perf_counter()

    cursor.execute(
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
        SELECT
            %s,
            %s,
            %s,
            report_date,
            availability,
            utilization
        FROM demo_stage_fleet

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
        """,
        (
            tenant[
                "company_id"
            ],
            tenant[
                "mine_id"
            ],
            tenant[
                "mine_name"
            ],
        ),
    )

    return {
        "upserted":
            cursor.rowcount,

        "upsert_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Server-Side Safety UPSERT
# ============================================================

def _upsert_safety(
    cursor,
    tenant: Dict[str, Any],
) -> Dict[str, Any]:

    started = perf_counter()

    cursor.execute(
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
        SELECT
            %s,
            %s,
            %s,
            report_date,
            incidents,
            near_misses,
            critical_risks,
            safety_score
        FROM demo_stage_safety

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
        """,
        (
            tenant[
                "company_id"
            ],
            tenant[
                "mine_id"
            ],
            tenant[
                "mine_name"
            ],
        ),
    )

    return {
        "upserted":
            cursor.rowcount,

        "upsert_seconds":
            round(
                perf_counter()
                - started,
                3,
            ),
    }


# ============================================================
# Main Persistence Function
# ============================================================

def persist_demo_data(
    demo_data: Dict[str, Any],
    mine_name: str,
) -> Dict[str, Any]:
    """
    Persist the complete synthetic operating history using
    PostgreSQL native COPY and temporary staging tables.

    Flow:

        Generate data
             ↓
        COPY into TEMP tables
             ↓
        INSERT ... SELECT
             ↓
        ON CONFLICT DO UPDATE
             ↓
        COMMIT once

    Current persisted domains:
        Production
        Plant
        Fleet
        Safety

    Maintenance and Workforce remain in memory because
    tenant-aware public tables do not currently exist.
    """

    total_started = (
        perf_counter()
    )


    # --------------------------------------------------------
    # Resolve tenant using existing SQLAlchemy session
    # --------------------------------------------------------

    tenant_started = (
        perf_counter()
    )

    db = SessionLocal()

    try:
        tenant = (
            resolve_demo_tenant(
                db=db,
                mine_name=mine_name,
            )
        )

    finally:
        db.close()

    tenant_seconds = (
        perf_counter()
        - tenant_started
    )


    # --------------------------------------------------------
    # Native psycopg2 connection
    # --------------------------------------------------------

    raw_connection = (
        engine.raw_connection()
    )

    cursor = None

    try:
        cursor = (
            raw_connection.cursor()
        )


        # ----------------------------------------------------
        # COPY → staging tables
        # ----------------------------------------------------

        production_copy = (
            _copy_production(
                cursor,
                demo_data.get(
                    "production",
                    [],
                ),
            )
        )

        plant_copy = (
            _copy_plant(
                cursor,
                demo_data.get(
                    "plant",
                    [],
                ),
            )
        )

        fleet_copy = (
            _copy_fleet(
                cursor,
                demo_data.get(
                    "fleet",
                    [],
                ),
            )
        )

        safety_copy = (
            _copy_safety(
                cursor,
                demo_data.get(
                    "safety",
                    [],
                ),
            )
        )


        # ----------------------------------------------------
        # Server-side UPSERT
        # ----------------------------------------------------

        production_upsert = (
            _upsert_production(
                cursor,
                tenant,
            )
        )

        plant_upsert = (
            _upsert_plant(
                cursor,
                tenant,
            )
        )

        fleet_upsert = (
            _upsert_fleet(
                cursor,
                tenant,
            )
        )

        safety_upsert = (
            _upsert_safety(
                cursor,
                tenant,
            )
        )


        # ----------------------------------------------------
        # Commit once
        # ----------------------------------------------------

        commit_started = (
            perf_counter()
        )

        raw_connection.commit()

        commit_seconds = (
            perf_counter()
            - commit_started
        )


        total_seconds = (
            perf_counter()
            - total_started
        )


        return {
            "success":
                True,

            "mode":
                "postgresql_copy_upsert",

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

            "production": {
                **production_copy,
                **production_upsert,
            },

            "plant": {
                **plant_copy,
                **plant_upsert,
            },

            "fleet": {
                **fleet_copy,
                **fleet_upsert,
            },

            "safety": {
                **safety_copy,
                **safety_upsert,
            },

            "maintenance_persisted":
                False,

            "workforce_persisted":
                False,

            "timing": {
                "tenant_resolution_seconds":
                    round(
                        tenant_seconds,
                        3,
                    ),

                "commit_seconds":
                    round(
                        commit_seconds,
                        3,
                    ),

                "total_seconds":
                    round(
                        total_seconds,
                        3,
                    ),
            },
        }


    except Exception:
        raw_connection.rollback()
        raise


    finally:
        if cursor is not None:
            cursor.close()

        raw_connection.close()