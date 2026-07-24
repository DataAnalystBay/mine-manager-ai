from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database import SessionLocal

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/production")
def production_kpi():
    db = SessionLocal()

    try:
        result = db.execute(text("""
            SELECT
                COALESCE(SUM(ore_plan), 0) AS ore_plan,
                COALESCE(SUM(ore_actual), 0) AS ore_actual,
                COALESCE(SUM(waste_plan), 0) AS waste_plan,
                COALESCE(SUM(waste_actual), 0) AS waste_actual,
                COALESCE(SUM(gold_produced_oz), 0) AS gold_produced_oz,
                COALESCE(AVG(recovery_pct), 0) AS recovery_pct
            FROM operations.production_daily
        """))

        row = result.fetchone()

        ore_plan = float(row.ore_plan)
        ore_actual = float(row.ore_actual)
        waste_plan = float(row.waste_plan)
        waste_actual = float(row.waste_actual)
        gold_produced_oz = float(row.gold_produced_oz)
        recovery_pct = float(row.recovery_pct)

        ore_score = round((ore_actual / ore_plan) * 100, 2) if ore_plan > 0 else 0
        waste_score = round((waste_actual / waste_plan) * 100, 2) if waste_plan > 0 else 0
        overall_score = round((ore_score + waste_score) / 2, 2)

        ore_variance = ore_actual - ore_plan
        waste_variance = waste_actual - waste_plan

        if overall_score >= 100:
            status = "GREEN"
        elif overall_score >= 95:
            status = "AMBER"
        else:
            status = "RED"

        summary = (
            f"Ore production achieved {ore_score}% of plan. "
            f"Waste movement achieved {waste_score}% of plan. "
            f"Average recovery is {round(recovery_pct, 2)}%."
        )

        if status == "GREEN":
            recommendation = "Operations are performing above plan. Maintain current operating strategy."
        elif status == "AMBER":
            recommendation = "Minor deviations detected. Monitor mining sequence, shovel allocation, and haul cycle performance."
        else:
            recommendation = "Performance is below threshold. Immediate operational review is required."

        return {
            "status": status,
            "ore_plan": round(ore_plan, 2),
            "ore_actual": round(ore_actual, 2),
            "ore_variance": round(ore_variance, 2),
            "production_score": ore_score,
            "waste_plan": round(waste_plan, 2),
            "waste_actual": round(waste_actual, 2),
            "waste_variance": round(waste_variance, 2),
            "waste_score": waste_score,
            "gold_produced_oz": round(gold_produced_oz, 2),
            "recovery_pct": round(recovery_pct, 2),
            "overall_score": overall_score,
            "summary": summary,
            "recommendation": recommendation,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()