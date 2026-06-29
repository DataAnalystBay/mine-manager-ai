from fastapi import APIRouter
from sqlalchemy import text

from app.database import SessionLocal

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

@router.get("/production")
def production_kpi():

    db = SessionLocal()

    result = db.execute(text("""
        SELECT
            SUM(ore_plan) as ore_plan,
            SUM(ore_actual) as ore_actual,
            SUM(waste_plan) as waste_plan,
            SUM(waste_actual) as waste_actual
        FROM operations.production_daily
    """))

    row = result.fetchone()

    ore_plan = float(row.ore_plan or 0)
    ore_actual = float(row.ore_actual or 0)

    waste_plan = float(row.waste_plan or 0)
    waste_actual = float(row.waste_actual or 0)

    db.close()

    # -----------------------------
    # KPI CALCULATIONS
    # -----------------------------

    ore_score = round((ore_actual / ore_plan) * 100, 2) if ore_plan > 0 else 0
    waste_score = round((waste_actual / waste_plan) * 100, 2) if waste_plan > 0 else 0

    overall_score = round((ore_score + waste_score) / 2, 2)

    # -----------------------------
    # STATUS LOGIC
    # -----------------------------

    if overall_score >= 100:
        status = "GREEN"
    elif 95 <= overall_score < 100:
        status = "AMBER"
    else:
        status = "RED"

    # -----------------------------
    # HUMAN SUMMARY
    # -----------------------------

    summary = (
        f"Ore performance is at {ore_score}%. "
        f"Waste performance is at {waste_score}%."
    )

    # -----------------------------
    # RECOMMENDATION ENGINE (RULE-BASED AI v1)
    # -----------------------------

    if status == "GREEN":
        recommendation = "Operations are performing above plan. Maintain current strategy."
    elif status == "AMBER":
        recommendation = "Minor deviations detected. Monitor shovel allocation and haul cycle efficiency."
    else:
        recommendation = "Performance below threshold. Immediate operational review required."

    # -----------------------------
    # FINAL RESPONSE
    # -----------------------------

    return {
        "status": status,
        "production_score": ore_score,
        "waste_score": waste_score,
        "overall_score": overall_score,
        "summary": summary,
        "recommendation": recommendation
    }