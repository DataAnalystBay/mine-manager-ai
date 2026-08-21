import csv
from pathlib import Path

import pandas as pd


# ============================================================
# Mine Manager AI
# Achit-Ikht V1.0 Customer Adapter
#
# Converts the Achit-Ikht synthetic master dataset into the
# existing Mine Manager AI V1.0 upload schemas.
#
# IMPORTANT:
# All source data is SYNTHETIC DEMO DATA.
# ============================================================


SOURCE_FILE = Path(
    "app/demo/data/achit_ikht/"
    "achit_ikht_master_2021_2025.csv"
)

OUTPUT_DIR = Path(
    "app/demo/data/achit_ikht/v1_uploads"
)


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def load_master():
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(
            f"Master dataset not found: {SOURCE_FILE}"
        )

    df = pd.read_csv(SOURCE_FILE)

    if len(df) != 60:
        raise ValueError(
            f"Expected 60 master records, found {len(df)}"
        )

    return df


def create_production(df):
    """
    V1.0 currently uses generic mining terminology:

        ore_plan
        ore_actual
        waste_plan
        waste_actual

    For the Achit-Ikht adapter:

        ore_plan   -> cathode production plan
        ore_actual -> cathode production actual

    Waste fields are set to zero because this demo represents
    the copper cathode processing operation rather than an
    open-pit waste movement operation.

    This is an adapter for V1.0 compatibility.
    """

    output = pd.DataFrame()

    output["report_date"] = df["date"]

    output["ore_plan"] = (
        df["cathode_production_plan_t"]
        .round(2)
    )

    output["ore_actual"] = (
        df["cathode_production_actual_t"]
        .round(2)
    )

    output["waste_plan"] = 0.0
    output["waste_actual"] = 0.0

    return output


def create_plant(df):
    """
    Map the cathode operation into the current V1.0 Plant schema.

    The current V1.0 Plant model only accepts:

        throughput_plan
        throughput_actual
        recovery

    For this customer adapter:

        throughput_plan
            -> cathode production plan

        throughput_actual
            -> cathode production actual

        recovery
            -> Cu recovery

    The richer SX-EW KPIs remain available in the master dataset.
    """

    output = pd.DataFrame()

    output["report_date"] = df["date"]

    output["throughput_plan"] = (
        df["cathode_production_plan_t"]
        .round(2)
    )

    output["throughput_actual"] = (
        df["cathode_production_actual_t"]
        .round(2)
    )

    output["recovery"] = (
        df["cu_recovery_pct"]
        .round(2)
    )

    return output


def calculate_safety_score(row):
    """
    Produce a synthetic 0-100 safety score using available
    Achit-Ikht demo indicators.

    This is intentionally transparent and deterministic.
    """

    score = 100.0

    lti = int(row["lti"])
    near_misses = int(row["near_misses"])
    trifr = float(row["trifr"])

    # Strong penalty for an LTI.
    score -= lti * 18

    # Moderate near-miss penalty.
    score -= min(
        near_misses * 1.5,
        12,
    )

    # TRIFR target configured for Achit-Ikht = 2.0.
    if trifr > 2.0:
        score -= min(
            (trifr - 2.0) * 8,
            12,
        )

    return round(
        clamp(score, 0, 100),
        2,
    )


def calculate_critical_risks(row):
    """
    Create synthetic critical-risk count from operational
    conditions.

    This is not actual Achit-Ikht safety information.
    """

    risks = 0

    if int(row["lti"]) > 0:
        risks += 1

    if int(row["near_misses"]) >= 6:
        risks += 1

    if float(row["trifr"]) >= 2.6:
        risks += 1

    return risks


def create_safety(df):
    output = pd.DataFrame()

    output["report_date"] = df["date"]

    # Current master dataset has LTI rather than generic incidents.
    # For V1.0 demo compatibility we treat each synthetic LTI
    # event as an incident.
    output["incidents"] = (
        df["lti"]
        .fillna(0)
        .astype(int)
    )

    output["near_misses"] = (
        df["near_misses"]
        .fillna(0)
        .astype(int)
    )

    output["critical_risks"] = df.apply(
        calculate_critical_risks,
        axis=1,
    )

    output["safety_score"] = df.apply(
        calculate_safety_score,
        axis=1,
    )

    return output


def validate_output(
    name,
    df,
    required_columns,
):
    missing = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            f"{name}: missing columns: {missing}"
        )

    if len(df) != 60:
        raise ValueError(
            f"{name}: expected 60 rows, found {len(df)}"
        )

    if df["report_date"].duplicated().any():
        raise ValueError(
            f"{name}: duplicate report dates found"
        )

    if df.isnull().any().any():
        raise ValueError(
            f"{name}: null values found"
        )


def write_excel(
    df,
    filename,
):
    path = OUTPUT_DIR / filename

    df.to_excel(
        path,
        index=False,
        engine="openpyxl",
    )

    return path


def write_csv(
    df,
    filename,
):
    path = OUTPUT_DIR / filename

    df.to_csv(
        path,
        index=False,
        encoding="utf-8-sig",
        quoting=csv.QUOTE_MINIMAL,
    )

    return path


def main():
    print("=" * 72)
    print(
        "Mine Manager AI — "
        "Achit-Ikht V1.0 Upload Adapter"
    )
    print("=" * 72)

    df = load_master()

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    production = create_production(df)
    plant = create_plant(df)
    safety = create_safety(df)

    validate_output(
        "Production",
        production,
        [
            "report_date",
            "ore_plan",
            "ore_actual",
            "waste_plan",
            "waste_actual",
        ],
    )

    validate_output(
        "Plant",
        plant,
        [
            "report_date",
            "throughput_plan",
            "throughput_actual",
            "recovery",
        ],
    )

    validate_output(
        "Safety",
        safety,
        [
            "report_date",
            "incidents",
            "near_misses",
            "critical_risks",
            "safety_score",
        ],
    )

    production_xlsx = write_excel(
        production,
        "Achit_Ikht_Production_2021_2025.xlsx",
    )

    plant_xlsx = write_excel(
        plant,
        "Achit_Ikht_Plant_2021_2025.xlsx",
    )

    safety_xlsx = write_excel(
        safety,
        "Achit_Ikht_Safety_2021_2025.xlsx",
    )

    # CSV copies are useful for manual inspection.
    write_csv(
        production,
        "Achit_Ikht_Production_2021_2025.csv",
    )

    write_csv(
        plant,
        "Achit_Ikht_Plant_2021_2025.csv",
    )

    write_csv(
        safety,
        "Achit_Ikht_Safety_2021_2025.csv",
    )

    print()
    print("Source:")
    print(f"  {SOURCE_FILE}")

    print()
    print("Generated V1.0 upload files:")
    print(f"  {production_xlsx}")
    print(f"  {plant_xlsx}")
    print(f"  {safety_xlsx}")

    print()
    print(
        f"Production rows: {len(production)}"
    )
    print(
        f"Plant rows:      {len(plant)}"
    )
    print(
        f"Safety rows:     {len(safety)}"
    )

    print()
    print(
        "Period: "
        f"{production.iloc[0]['report_date']} "
        "to "
        f"{production.iloc[-1]['report_date']}"
    )

    print()
    print(
        "IMPORTANT: These files contain synthetic "
        "Achit-Ikht demonstration data."
    )

    print()
    print(
        "Achit-Ikht V1.0 upload files "
        "generated successfully."
    )


if __name__ == "__main__":
    main()