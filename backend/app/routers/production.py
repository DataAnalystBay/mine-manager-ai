import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
)

from app.database import (
    SessionLocal,
)


# ============================================================
# Router
# ============================================================

router = APIRouter(
    prefix="/api/production",
    tags=["Production"],
    dependencies=[
        Depends(
            get_current_user
        ),
    ],
)


# ============================================================
# Active Tenant
# ============================================================

ACTIVE_COMPANY_ID = int(
    os.getenv(
        "ACTIVE_COMPANY_ID",
        "1",
    )
)

ACTIVE_MINE_ID = int(
    os.getenv(
        "ACTIVE_MINE_ID",
        "1",
    )
)


# ============================================================
# Supported Historical Ranges
# ============================================================

SUPPORTED_TREND_RANGES = {
    "30D",
    "90D",
    "1Y",
    "3Y",
    "5Y",
}


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():
    """
    Provide a database session and close it after the request.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# ACTIVE TENANT RESOLUTION
# ============================================================

def resolve_active_tenant(
    db: Session,
):
    """
    Resolve the active company and mine.

    ACTIVE_COMPANY_ID + ACTIVE_MINE_ID are the authoritative
    V1.0 tenant boundary.

    Operational queries must not rely on mine_name alone.
    """

    tenant = db.execute(
        text(
            """
            SELECT
                m.id AS mine_id,
                m.company_id AS company_id,
                m.mine_name AS mine_name,
                m.mine_type AS mine_type,
                c.company_name AS company_name
            FROM public.mine_settings AS m
            JOIN public.company_settings AS c
                ON c.id = m.company_id
            WHERE m.id = :mine_id
              AND m.company_id = :company_id
            """
        ),
        {
            "company_id":
                ACTIVE_COMPANY_ID,

            "mine_id":
                ACTIVE_MINE_ID,
        },
    ).mappings().first()

    if tenant is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Active tenant was not found: "
                f"company_id={ACTIVE_COMPANY_ID}, "
                f"mine_id={ACTIVE_MINE_ID}"
            ),
        )

    mine_type = str(
        tenant[
            "mine_type"
        ]
        or ""
    ).strip().lower()

    is_sxew_operation = (
        mine_type
        in {
            "processing plant / sx-ew",
            "sx-ew",
            "hydrometallurgical copper processing",
        }
        or tenant[
            "mine_name"
        ]
        == (
            "Achit-Ikht Copper "
            "Cathode Operation"
        )
    )

    return {
        "company_id":
            int(
                tenant[
                    "company_id"
                ]
            ),

        "mine_id":
            int(
                tenant[
                    "mine_id"
                ]
            ),

        "company_name":
            tenant[
                "company_name"
            ],

        "mine_name":
            tenant[
                "mine_name"
            ],

        "mine_type":
            tenant[
                "mine_type"
            ],

        "operation_profile":
            (
                "sxew_copper"
                if is_sxew_operation
                else "standard_mine"
            ),

        "waste_applicable":
            (
                not is_sxew_operation
            ),
    }


# ============================================================
# DISPLAY METADATA
# ============================================================

def build_production_metadata(
    tenant: dict,
):
    """
    Return operation-aware labels while preserving the current
    V1.0 database field names.

    For SX-EW:
        ore_* fields represent cathode production.
        waste_* fields are not applicable.

    For standard mine:
        existing ore/waste terminology is preserved.
    """

    if (
        tenant[
            "operation_profile"
        ]
        == "sxew_copper"
    ):
        return {
            "production_label":
                "Cathode Production",

            "production_unit":
                "t",

            "ore_label":
                "Cathode Production",

            "waste_label":
                "Not Applicable",

            "waste_applicable":
                False,
        }

    return {
        "production_label":
            "Ore Production",

        "production_unit":
            "t",

        "ore_label":
            "Ore Production",

        "waste_label":
            "Waste Movement",

        "waste_applicable":
            True,
    }


# ============================================================
# TREND RANGE NORMALIZATION
# ============================================================

def normalize_trend_range(
    requested_range: str,
) -> str:
    """
    Normalize and validate the Production trend range.
    """

    normalized = str(
        requested_range
        or "30D"
    ).strip().upper()

    if (
        normalized
        not in SUPPORTED_TREND_RANGES
    ):
        return "30D"

    return normalized


# ============================================================
# TODAY
# ============================================================

@router.get(
    "/today"
)
def get_today_production(
    db: Session = Depends(
        get_db
    ),
):
    """
    Return the latest available Production record for the
    active tenant.

    Tenant isolation is enforced through:
        company_id + mine_id

    mine_name is returned only for display/context.
    """

    try:
        tenant = (
            resolve_active_tenant(
                db=db,
            )
        )

        metadata = (
            build_production_metadata(
                tenant
            )
        )

        query = text(
            """
            SELECT
                company_id,
                mine_id,
                mine_name,
                report_date,
                ore_plan,
                ore_actual,
                waste_plan,
                waste_actual
            FROM public.production_daily
            WHERE company_id = :company_id
              AND mine_id = :mine_id
            ORDER BY report_date DESC
            LIMIT 1
            """
        )

        result = db.execute(
            query,
            {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],
            },
        ).mappings().first()

        if not result:
            return {
                "company_id":
                    tenant[
                        "company_id"
                    ],

                "mine_id":
                    tenant[
                        "mine_id"
                    ],

                "company_name":
                    tenant[
                        "company_name"
                    ],

                "mine_name":
                    tenant[
                        "mine_name"
                    ],

                "operation_profile":
                    tenant[
                        "operation_profile"
                    ],

                **metadata,

                "message":
                    "No production data found",

                "report_date":
                    None,

                "ore_plan":
                    0,

                "ore_actual":
                    0,

                "ore_variance":
                    0,

                "waste_plan":
                    0,

                "waste_actual":
                    0,

                "waste_variance":
                    0,
            }

        ore_plan = float(
            result[
                "ore_plan"
            ]
            or 0
        )

        ore_actual = float(
            result[
                "ore_actual"
            ]
            or 0
        )

        waste_plan = float(
            result[
                "waste_plan"
            ]
            or 0
        )

        waste_actual = float(
            result[
                "waste_actual"
            ]
            or 0
        )

        ore_variance = round(
            ore_actual
            - ore_plan,
            2,
        )

        waste_variance = round(
            waste_actual
            - waste_plan,
            2,
        )

        return {
            "company_id":
                tenant[
                    "company_id"
                ],

            "mine_id":
                tenant[
                    "mine_id"
                ],

            "company_name":
                tenant[
                    "company_name"
                ],

            "mine_name":
                tenant[
                    "mine_name"
                ],

            "mine_type":
                tenant[
                    "mine_type"
                ],

            "operation_profile":
                tenant[
                    "operation_profile"
                ],

            **metadata,

            "report_date":
                str(
                    result[
                        "report_date"
                    ]
                ),

            "ore_plan":
                round(
                    ore_plan,
                    2,
                ),

            "ore_actual":
                round(
                    ore_actual,
                    2,
                ),

            "ore_variance":
                ore_variance,

            "waste_plan":
                round(
                    waste_plan,
                    2,
                ),

            "waste_actual":
                round(
                    waste_actual,
                    2,
                ),

            "waste_variance":
                waste_variance,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the latest "
                "production data."
            ),
        ) from exc


# ============================================================
# TREND
# ============================================================

@router.get(
    "/trend"
)
def get_production_trend(
    range: str = "30D",
    db: Session = Depends(
        get_db
    ),
):
    """
    Return Production trend data for the active tenant.

    Supported ranges:

        30D
            Latest 30 reporting periods.
            Daily resolution.

        90D
            Latest 90 reporting periods.
            Daily resolution.

        1Y
            Latest one year.
            Weekly aggregation.

        3Y
            Latest three years.
            Monthly aggregation.

        5Y
            Complete available historical dataset.
            Monthly aggregation.

    The historical selector affects only trend data.

    Current KPI cards continue to use /today.
    """

    try:
        tenant = (
            resolve_active_tenant(
                db=db,
            )
        )

        metadata = (
            build_production_metadata(
                tenant
            )
        )

        selected_range = (
            normalize_trend_range(
                range
            )
        )


        # ====================================================
        # 30 DAYS
        # ====================================================

        if selected_range == "30D":

            aggregation = "daily"

            query = text(
                """
                SELECT
                    company_id,
                    mine_id,
                    mine_name,
                    report_date,
                    ore_plan,
                    ore_actual,
                    waste_plan,
                    waste_actual
                FROM public.production_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT 30
                """
            )

            results = db.execute(
                query,
                {
                    "company_id":
                        tenant[
                            "company_id"
                        ],

                    "mine_id":
                        tenant[
                            "mine_id"
                        ],
                },
            ).mappings().all()

            results = list(
                reversed(
                    results
                )
            )


        # ====================================================
        # 90 DAYS
        # ====================================================

        elif selected_range == "90D":

            aggregation = "daily"

            query = text(
                """
                SELECT
                    company_id,
                    mine_id,
                    mine_name,
                    report_date,
                    ore_plan,
                    ore_actual,
                    waste_plan,
                    waste_actual
                FROM public.production_daily
                WHERE company_id = :company_id
                  AND mine_id = :mine_id
                ORDER BY report_date DESC
                LIMIT 90
                """
            )

            results = db.execute(
                query,
                {
                    "company_id":
                        tenant[
                            "company_id"
                        ],

                    "mine_id":
                        tenant[
                            "mine_id"
                        ],
                },
            ).mappings().all()

            results = list(
                reversed(
                    results
                )
            )


        # ====================================================
        # 1 YEAR
        # ====================================================

        elif selected_range == "1Y":

            aggregation = "weekly"

            query = text(
                """
                WITH latest_date AS
                (
                    SELECT
                        MAX(report_date)
                            AS max_date
                    FROM public.production_daily
                    WHERE company_id = :company_id
                      AND mine_id = :mine_id
                )

                SELECT
                    :company_id
                        AS company_id,

                    :mine_id
                        AS mine_id,

                    MAX(
                        p.mine_name
                    )
                        AS mine_name,

                    DATE_TRUNC(
                        'week',
                        p.report_date
                    )::date
                        AS report_date,

                    SUM(
                        COALESCE(
                            p.ore_plan,
                            0
                        )
                    )
                        AS ore_plan,

                    SUM(
                        COALESCE(
                            p.ore_actual,
                            0
                        )
                    )
                        AS ore_actual,

                    SUM(
                        COALESCE(
                            p.waste_plan,
                            0
                        )
                    )
                        AS waste_plan,

                    SUM(
                        COALESCE(
                            p.waste_actual,
                            0
                        )
                    )
                        AS waste_actual

                FROM
                    public.production_daily
                    AS p

                CROSS JOIN
                    latest_date
                    AS ld

                WHERE
                    p.company_id =
                        :company_id

                    AND p.mine_id =
                        :mine_id

                    AND p.report_date >
                        ld.max_date
                        - INTERVAL '1 year'

                GROUP BY
                    DATE_TRUNC(
                        'week',
                        p.report_date
                    )

                ORDER BY
                    report_date ASC
                """
            )

            results = db.execute(
                query,
                {
                    "company_id":
                        tenant[
                            "company_id"
                        ],

                    "mine_id":
                        tenant[
                            "mine_id"
                        ],
                },
            ).mappings().all()


        # ====================================================
        # 3 YEARS
        # ====================================================

        elif selected_range == "3Y":

            aggregation = "monthly"

            query = text(
                """
                WITH latest_date AS
                (
                    SELECT
                        MAX(report_date)
                            AS max_date
                    FROM public.production_daily
                    WHERE company_id = :company_id
                      AND mine_id = :mine_id
                )

                SELECT
                    :company_id
                        AS company_id,

                    :mine_id
                        AS mine_id,

                    MAX(
                        p.mine_name
                    )
                        AS mine_name,

                    DATE_TRUNC(
                        'month',
                        p.report_date
                    )::date
                        AS report_date,

                    SUM(
                        COALESCE(
                            p.ore_plan,
                            0
                        )
                    )
                        AS ore_plan,

                    SUM(
                        COALESCE(
                            p.ore_actual,
                            0
                        )
                    )
                        AS ore_actual,

                    SUM(
                        COALESCE(
                            p.waste_plan,
                            0
                        )
                    )
                        AS waste_plan,

                    SUM(
                        COALESCE(
                            p.waste_actual,
                            0
                        )
                    )
                        AS waste_actual

                FROM
                    public.production_daily
                    AS p

                CROSS JOIN
                    latest_date
                    AS ld

                WHERE
                    p.company_id =
                        :company_id

                    AND p.mine_id =
                        :mine_id

                    AND p.report_date >
                        ld.max_date
                        - INTERVAL '3 years'

                GROUP BY
                    DATE_TRUNC(
                        'month',
                        p.report_date
                    )

                ORDER BY
                    report_date ASC
                """
            )

            results = db.execute(
                query,
                {
                    "company_id":
                        tenant[
                            "company_id"
                        ],

                    "mine_id":
                        tenant[
                            "mine_id"
                        ],
                },
            ).mappings().all()


        # ====================================================
        # 5 YEARS / COMPLETE HISTORY
        # ====================================================

        else:

            aggregation = "monthly"

            query = text(
                """
                SELECT
                    :company_id
                        AS company_id,

                    :mine_id
                        AS mine_id,

                    MAX(
                        p.mine_name
                    )
                        AS mine_name,

                    DATE_TRUNC(
                        'month',
                        p.report_date
                    )::date
                        AS report_date,

                    SUM(
                        COALESCE(
                            p.ore_plan,
                            0
                        )
                    )
                        AS ore_plan,

                    SUM(
                        COALESCE(
                            p.ore_actual,
                            0
                        )
                    )
                        AS ore_actual,

                    SUM(
                        COALESCE(
                            p.waste_plan,
                            0
                        )
                    )
                        AS waste_plan,

                    SUM(
                        COALESCE(
                            p.waste_actual,
                            0
                        )
                    )
                        AS waste_actual

                FROM
                    public.production_daily
                    AS p

                WHERE
                    p.company_id =
                        :company_id

                    AND p.mine_id =
                        :mine_id

                GROUP BY
                    DATE_TRUNC(
                        'month',
                        p.report_date
                    )

                ORDER BY
                    report_date ASC
                """
            )

            results = db.execute(
                query,
                {
                    "company_id":
                        tenant[
                            "company_id"
                        ],

                    "mine_id":
                        tenant[
                            "mine_id"
                        ],
                },
            ).mappings().all()


        # ====================================================
        # Normalize Response
        # ====================================================

        data = []

        for row in results:

            ore_plan = float(
                row[
                    "ore_plan"
                ]
                or 0
            )

            ore_actual = float(
                row[
                    "ore_actual"
                ]
                or 0
            )

            waste_plan = float(
                row[
                    "waste_plan"
                ]
                or 0
            )

            waste_actual = float(
                row[
                    "waste_actual"
                ]
                or 0
            )

            ore_variance = round(
                ore_actual
                - ore_plan,
                2,
            )

            waste_variance = round(
                waste_actual
                - waste_plan,
                2,
            )

            ore_attainment = (
                round(
                    (
                        ore_actual
                        / ore_plan
                    )
                    * 100,
                    1,
                )
                if ore_plan > 0
                else None
            )

            waste_attainment = (
                round(
                    (
                        waste_actual
                        / waste_plan
                    )
                    * 100,
                    1,
                )
                if waste_plan > 0
                else None
            )

            data.append(
                {
                    "company_id":
                        tenant[
                            "company_id"
                        ],

                    "mine_id":
                        tenant[
                            "mine_id"
                        ],

                    "company_name":
                        tenant[
                            "company_name"
                        ],

                    "mine_name":
                        tenant[
                            "mine_name"
                        ],

                    "mine_type":
                        tenant[
                            "mine_type"
                        ],

                    "operation_profile":
                        tenant[
                            "operation_profile"
                        ],

                    **metadata,

                    "range":
                        selected_range,

                    "aggregation":
                        aggregation,

                    "report_date":
                        str(
                            row[
                                "report_date"
                            ]
                        ),

                    "ore_plan":
                        round(
                            ore_plan,
                            2,
                        ),

                    "ore_actual":
                        round(
                            ore_actual,
                            2,
                        ),

                    "ore_variance":
                        ore_variance,

                    "ore_attainment":
                        ore_attainment,

                    "waste_plan":
                        round(
                            waste_plan,
                            2,
                        ),

                    "waste_actual":
                        round(
                            waste_actual,
                            2,
                        ),

                    "waste_variance":
                        waste_variance,

                    "waste_attainment":
                        waste_attainment,
                }
            )

        return data


    except HTTPException:
        raise


    except Exception as exc:
        raise HTTPException(
            status_code=(
                status
                .HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the "
                "production trend."
            ),
        ) from exc