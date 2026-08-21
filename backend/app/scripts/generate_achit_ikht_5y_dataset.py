import csv
import math
import random
from datetime import date
from pathlib import Path


# ============================================================
# MINE MANAGER AI
# ACHIT-IKHT SYNTHETIC DEMO DATASET
# 2021-2025
#
# IMPORTANT:
# This is synthetic demonstration data.
# It is NOT actual Achit-Ikht operational or financial data.
# ============================================================


random.seed(42)


OUTPUT_DIR = Path("app/demo/data/achit_ikht")
OUTPUT_FILE = OUTPUT_DIR / "achit_ikht_master_2021_2025.csv"


# ------------------------------------------------------------
# Annual synthetic production assumptions
# ------------------------------------------------------------

ANNUAL_PRODUCTION_PLAN = {
    2021: 9000,
    2022: 9200,
    2023: 9500,
    2024: 9800,
    2025: 10000,
}

ANNUAL_PRODUCTION_ACTUAL = {
    2021: 8250,
    2022: 8100,
    2023: 8400,
    2024: 9000,
    2025: 9400,
}


# ------------------------------------------------------------
# Synthetic revenue assumptions in MNT
#
# These are intentionally demo assumptions,
# not reported Achit-Ikht financial results.
# ------------------------------------------------------------

BASE_REVENUE_PER_TONNE_MNT = {
    2021: 25_250_000,
    2022: 25_980_000,
    2023: 29_320_000,
    2024: 31_280_000,
    2025: 33_120_000,
}


# ------------------------------------------------------------
# Monthly production weighting
#
# Slight seasonal differences make the dataset look more
# realistic than dividing annual production equally by 12.
# ------------------------------------------------------------

MONTH_WEIGHTS = [
    0.078,
    0.075,
    0.081,
    0.082,
    0.085,
    0.086,
    0.088,
    0.089,
    0.087,
    0.083,
    0.082,
    0.084,
]

WEIGHT_TOTAL = sum(MONTH_WEIGHTS)
MONTH_WEIGHTS = [w / WEIGHT_TOTAL for w in MONTH_WEIGHTS]


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def round2(value):
    return round(float(value), 2)


def monthly_values_from_annual(annual_value):
    values = [
        annual_value * weight
        for weight in MONTH_WEIGHTS
    ]

    return values


def operating_profile(year, month):
    """
    Generate synthetic operating conditions.

    The story is:

    2021:
        Stable but below desired performance.

    2022:
        Higher operational pressure and weaker availability.

    2023:
        Recovery starts improving.

    2024:
        Strong operational recovery.

    2025:
        Strong overall year, but deterioration appears
        during Q4 to create a useful Mine Manager AI demo.
    """

    year_factor = {
        2021: 0.0,
        2022: -0.6,
        2023: 0.2,
        2024: 1.0,
        2025: 1.2,
    }[year]

    seasonal = math.sin((month / 12) * 2 * math.pi)

    # --------------------------------------------------------
    # Plant availability
    # Target configured in Mine Manager AI = 93%
    # --------------------------------------------------------

    availability = (
        91.4
        + year_factor
        + seasonal * 0.8
        + random.uniform(-1.2, 1.2)
    )

    # 2022 pressure
    if year == 2022 and month in [4, 5, 9]:
        availability -= random.uniform(2.0, 3.5)

    # 2025 Q4 deterioration
    if year == 2025 and month == 10:
        availability -= 2.2

    if year == 2025 and month == 11:
        availability -= 3.1

    if year == 2025 and month == 12:
        availability -= 4.1

    availability = clamp(
        availability,
        83.0,
        96.5,
    )

    # --------------------------------------------------------
    # Plant utilization
    # Mine Manager AI target = 90%
    # --------------------------------------------------------

    utilization = (
        availability
        - random.uniform(1.5, 4.0)
    )

    utilization = clamp(
        utilization,
        78.0,
        94.0,
    )

    # --------------------------------------------------------
    # PLS Cu grade
    # Demo target = 2.55 g/L
    # --------------------------------------------------------

    pls_grade = (
        2.46
        + year_factor * 0.025
        + seasonal * 0.04
        + random.uniform(-0.07, 0.07)
    )

    if year == 2025 and month >= 10:
        pls_grade -= 0.10 + ((month - 10) * 0.035)

    pls_grade = clamp(
        pls_grade,
        2.05,
        2.75,
    )

    # --------------------------------------------------------
    # Copper recovery
    # Target = 77%
    #
    # Correlated with:
    # - PLS grade
    # - availability
    # --------------------------------------------------------

    recovery = (
        73.7
        + year_factor * 0.75
        + (pls_grade - 2.40) * 4.0
        + (availability - 90) * 0.12
        + random.uniform(-0.7, 0.7)
    )

    if year == 2025 and month >= 10:
        recovery -= (
            0.8
            + (month - 10) * 0.7
        )

    recovery = clamp(
        recovery,
        70.0,
        79.0,
    )

    # --------------------------------------------------------
    # EW current efficiency
    # Target = 92%
    # --------------------------------------------------------

    ew_efficiency = (
        90.0
        + year_factor * 0.45
        + (recovery - 74) * 0.18
        + random.uniform(-0.7, 0.7)
    )

    if year == 2025 and month >= 11:
        ew_efficiency -= 1.0

    ew_efficiency = clamp(
        ew_efficiency,
        85.0,
        94.5,
    )

    # --------------------------------------------------------
    # Acid consumption
    # Lower is better
    # Target = 4.0 kg/t
    #
    # Recovery problems drive higher consumption.
    # --------------------------------------------------------

    acid_consumption = (
        4.15
        - year_factor * 0.04
        + (76 - recovery) * 0.045
        + random.uniform(-0.10, 0.10)
    )

    if year == 2025 and month >= 10:
        acid_consumption += (
            0.12
            + (month - 10) * 0.08
        )

    acid_consumption = clamp(
        acid_consumption,
        3.65,
        4.85,
    )

    # --------------------------------------------------------
    # Power consumption
    # Lower is better
    # Target = 2250 kWh/t
    # --------------------------------------------------------

    power_consumption = (
        2290
        - year_factor * 15
        + (92 - ew_efficiency) * 22
        + random.uniform(-35, 35)
    )

    if year == 2025 and month >= 11:
        power_consumption += 80

    power_consumption = clamp(
        power_consumption,
        2100,
        2600,
    )

    # --------------------------------------------------------
    # Synthetic maintenance downtime
    #
    # This is not one of the 11 configured KPI targets,
    # but it helps AI explain plant availability.
    # --------------------------------------------------------

    unplanned_downtime_hours = (
        max(
            2,
            (94 - availability) * 8
            + random.uniform(-4, 8),
        )
    )

    if year == 2025 and month >= 10:
        unplanned_downtime_hours += (
            month - 9
        ) * 8

    unplanned_downtime_hours = clamp(
        unplanned_downtime_hours,
        2,
        110,
    )

    # --------------------------------------------------------
    # Safety
    # --------------------------------------------------------

    trifr = (
        2.4
        - (year - 2021) * 0.14
        + random.uniform(-0.25, 0.25)
    )

    trifr = clamp(
        trifr,
        0.8,
        3.2,
    )

    lti = 0

    # Two synthetic historical events
    if year == 2022 and month == 8:
        lti = 1

    if year == 2023 and month == 3:
        lti = 1

    near_misses = max(
        0,
        int(
            random.gauss(
                4 if year <= 2022 else 3,
                1.4,
            )
        ),
    )

    if year == 2025 and month in [10, 11, 12]:
        near_misses += month - 9

    return {
        "plant_availability_pct": round2(availability),
        "plant_utilization_pct": round2(utilization),
        "pls_cu_grade_g_l": round2(pls_grade),
        "cu_recovery_pct": round2(recovery),
        "ew_current_efficiency_pct": round2(ew_efficiency),
        "acid_consumption_kg_t": round2(acid_consumption),
        "power_consumption_kwh_t": round2(power_consumption),
        "unplanned_downtime_hours": round2(
            unplanned_downtime_hours
        ),
        "trifr": round2(trifr),
        "lti": lti,
        "near_misses": near_misses,
    }


def calculate_actual_monthly_production(
    annual_actual,
    year,
):
    """
    Spread annual production across months.

    2025 is deliberately shaped so Q4 weakens,
    creating a useful demo scenario.
    """

    monthly = monthly_values_from_annual(
        annual_actual
    )

    if year == 2025:
        # Q4 production deterioration
        adjustment = [
            1.00,
            1.00,
            1.01,
            1.01,
            1.02,
            1.02,
            1.03,
            1.03,
            1.02,
            0.97,
            0.92,
            0.88,
        ]

        adjusted = [
            monthly[i] * adjustment[i]
            for i in range(12)
        ]

        total = sum(adjusted)

        # Scale back to required annual total
        scale = annual_actual / total

        monthly = [
            value * scale
            for value in adjusted
        ]

    return monthly


def generate_dataset():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    rows = []

    for year in range(
        2021,
        2026,
    ):
        annual_plan = ANNUAL_PRODUCTION_PLAN[
            year
        ]

        annual_actual = ANNUAL_PRODUCTION_ACTUAL[
            year
        ]

        monthly_plan = monthly_values_from_annual(
            annual_plan
        )

        monthly_actual = (
            calculate_actual_monthly_production(
                annual_actual,
                year,
            )
        )

        for month in range(
            1,
            13,
        ):
            operational = operating_profile(
                year,
                month,
            )

            plan = monthly_plan[
                month - 1
            ]

            actual = monthly_actual[
                month - 1
            ]

            # Link production performance to plant condition.
            plant_factor = (
                operational[
                    "plant_availability_pct"
                ]
                / 93.0
            )

            recovery_factor = (
                operational[
                    "cu_recovery_pct"
                ]
                / 77.0
            )

            performance_factor = (
                plant_factor * 0.45
                + recovery_factor * 0.55
            )

            # Moderate effect so annual volumes remain
            # consistent with synthetic assumptions.
            adjusted_actual = (
                actual
                * (
                    0.92
                    + 0.08
                    * performance_factor
                )
            )

            production_attainment = (
                adjusted_actual
                / plan
                * 100
            )

            revenue_per_tonne = (
                BASE_REVENUE_PER_TONNE_MNT[
                    year
                ]
                * random.uniform(
                    0.96,
                    1.04,
                )
            )

            revenue_mnt = (
                adjusted_actual
                * revenue_per_tonne
            )

            # Synthetic production cost.
            unit_cost_mnt_t = (
                13_500_000
                + (
                    93
                    - operational[
                        "plant_availability_pct"
                    ]
                )
                * 95_000
                + (
                    operational[
                        "acid_consumption_kg_t"
                    ]
                    - 4.0
                )
                * 280_000
                + random.uniform(
                    -250_000,
                    250_000,
                )
            )

            unit_cost_mnt_t = max(
                unit_cost_mnt_t,
                11_500_000,
            )

            operating_cost_mnt = (
                adjusted_actual
                * unit_cost_mnt_t
            )

            operating_margin_mnt = (
                revenue_mnt
                - operating_cost_mnt
            )

            row = {
                "date": date(
                    year,
                    month,
                    1,
                ).isoformat(),

                "year": year,
                "month": month,

                "company": "Achit-Ikht LLC",

                "operation": (
                    "Achit-Ikht Copper "
                    "Cathode Operation"
                ),

                "data_type": "SYNTHETIC_DEMO",

                "cathode_production_plan_t": round2(
                    plan
                ),

                "cathode_production_actual_t": round2(
                    adjusted_actual
                ),

                "production_plan_attainment_pct": round2(
                    production_attainment
                ),

                **operational,

                "revenue_per_tonne_mnt": round(
                    revenue_per_tonne
                ),

                "revenue_mnt": round(
                    revenue_mnt
                ),

                "unit_operating_cost_mnt_t": round(
                    unit_cost_mnt_t
                ),

                "operating_cost_mnt": round(
                    operating_cost_mnt
                ),

                "operating_margin_mnt": round(
                    operating_margin_mnt
                ),
            }

            rows.append(row)

    fieldnames = list(
        rows[0].keys()
    )

    with OUTPUT_FILE.open(
        "w",
        newline="",
        encoding="utf-8-sig",
    ) as csvfile:

        writer = csv.DictWriter(
            csvfile,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(rows)

    print("=" * 70)
    print(
        "Mine Manager AI — "
        "Achit-Ikht 2021-2025 "
        "Synthetic Dataset"
    )
    print("=" * 70)

    print(
        f"Output file: {OUTPUT_FILE}"
    )

    print(
        f"Rows generated: {len(rows)}"
    )

    print(
        "Period: "
        f"{rows[0]['date']} "
        "to "
        f"{rows[-1]['date']}"
    )

    print()

    print(
        "IMPORTANT: "
        "All values are synthetic "
        "demo data."
    )

    print()

    print(
        "Dataset generated successfully."
    )


if __name__ == "__main__":
    generate_dataset()