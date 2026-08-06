from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text

from app.auth.dependencies import get_current_user
from app.database import SessionLocal


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
    dependencies=[
        Depends(get_current_user),
    ],
)


@router.get("/production")
def production_kpi():
    """
    Return aggregated production KPI performance.

    Authentication is enforced at the router level.
    """

    db = SessionLocal()

    try:
        result = db.execute(
            text(
                """
                SELECT
                    COALESCE(SUM(ore_plan), 0) AS ore_plan,
                    COALESCE(SUM(ore_actual), 0) AS ore_actual,
                    COALESCE(SUM(waste_plan), 0) AS waste_plan,
                    COALESCE(SUM(waste_actual), 0) AS waste_actual,
                    COALESCE(SUM(gold_produced_oz), 0) AS gold_produced_oz,
                    COALESCE(AVG(recovery_pct), 0) AS recovery_pct
                FROM operations.production_daily
                """
            )
        )

        row = result.fetchone()

        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Production KPI data was not found.",
            )

        ore_plan = float(row.ore_plan or 0)
        ore_actual = float(row.ore_actual or 0)
        waste_plan = float(row.waste_plan or 0)
        waste_actual = float(row.waste_actual or 0)
        gold_produced_oz = float(
            row.gold_produced_oz or 0
        )
        recovery_pct = float(
            row.recovery_pct or 0
        )

        ore_score = (
            round(
                (ore_actual / ore_plan) * 100,
                2,
            )
            if ore_plan > 0
            else 0
        )

        waste_score = (
            round(
                (waste_actual / waste_plan) * 100,
                2,
            )
            if waste_plan > 0
            else 0
        )

        overall_score = round(
            (ore_score + waste_score) / 2,
            2,
        )

        ore_variance = (
            ore_actual - ore_plan
        )

        waste_variance = (
            waste_actual - waste_plan
        )

        if overall_score >= 100:
            kpi_status = "GREEN"
        elif overall_score >= 95:
            kpi_status = "AMBER"
        else:
            kpi_status = "RED"

        summary = (
            f"Ore production achieved "
            f"{ore_score}% of plan. "
            f"Waste movement achieved "
            f"{waste_score}% of plan. "
            f"Average recovery is "
            f"{round(recovery_pct, 2)}%."
        )

        if kpi_status == "GREEN":
            recommendation = (
                "Operations are performing above plan. "
                "Maintain the current operating strategy."
            )
        elif kpi_status == "AMBER":
            recommendation = (
                "Minor deviations detected. Monitor the "
                "mining sequence, shovel allocation, and "
                "haul-cycle performance."
            )
        else:
            recommendation = (
                "Performance is below threshold. "
                "An immediate operational review is required."
            )

        return {
            "status": kpi_status,
            "ore_plan": round(
                ore_plan,
                2,
            ),
            "ore_actual": round(
                ore_actual,
                2,
            ),
            "ore_variance": round(
                ore_variance,
                2,
            ),
            "production_score": ore_score,
            "waste_plan": round(
                waste_plan,
                2,
            ),
            "waste_actual": round(
                waste_actual,
                2,
            ),
            "waste_variance": round(
                waste_variance,
                2,
            ),
            "waste_score": waste_score,
            "gold_produced_oz": round(
                gold_produced_oz,
                2,
            ),
            "recovery_pct": round(
                recovery_pct,
                2,
            ),
            "overall_score": overall_score,
            "summary": summary,
            "recommendation": recommendation,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to generate production analytics."
            ),
        ) from exc

    finally:
        db.close()