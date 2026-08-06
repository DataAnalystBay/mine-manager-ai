from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import SessionLocal


router = APIRouter(
    prefix="/api/production",
    tags=["Production"],
    dependencies=[
        Depends(get_current_user),
    ],
)


def get_db():
    """
    Provide a database session and close it after the request.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/today")
def get_today_production(
    db: Session = Depends(get_db),
):
    """
    Return the latest available production record.

    Authentication is enforced at the router level.
    """

    try:
        query = text(
            """
            SELECT
                report_date,
                ore_plan,
                ore_actual,
                waste_plan,
                waste_actual
            FROM production_daily
            ORDER BY report_date DESC
            LIMIT 1
            """
        )

        result = db.execute(
            query
        ).mappings().first()

        if not result:
            return {
                "message": "No production data found",
                "report_date": None,
                "ore_plan": 0,
                "ore_actual": 0,
                "ore_variance": 0,
                "waste_plan": 0,
                "waste_actual": 0,
                "waste_variance": 0,
            }

        ore_plan = float(
            result["ore_plan"] or 0
        )

        ore_actual = float(
            result["ore_actual"] or 0
        )

        waste_plan = float(
            result["waste_plan"] or 0
        )

        waste_actual = float(
            result["waste_actual"] or 0
        )

        ore_variance = round(
            ore_actual - ore_plan,
            2,
        )

        waste_variance = round(
            waste_actual - waste_plan,
            2,
        )

        return {
            "report_date": str(
                result["report_date"]
            ),
            "ore_plan": round(
                ore_plan,
                2,
            ),
            "ore_actual": round(
                ore_actual,
                2,
            ),
            "ore_variance": ore_variance,
            "waste_plan": round(
                waste_plan,
                2,
            ),
            "waste_actual": round(
                waste_actual,
                2,
            ),
            "waste_variance": waste_variance,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the latest production data."
            ),
        ) from exc


@router.get("/trend")
def get_production_trend(
    db: Session = Depends(get_db),
):
    """
    Return up to 30 recent production records in chronological order.

    Authentication is enforced at the router level.
    """

    try:
        query = text(
            """
            SELECT
                report_date,
                ore_plan,
                ore_actual,
                waste_plan,
                waste_actual
            FROM production_daily
            ORDER BY report_date DESC
            LIMIT 30
            """
        )

        results = db.execute(
            query
        ).mappings().all()

        data = []

        for row in reversed(results):
            data.append(
                {
                    "report_date": str(
                        row["report_date"]
                    ),
                    "ore_plan": round(
                        float(
                            row["ore_plan"] or 0
                        ),
                        2,
                    ),
                    "ore_actual": round(
                        float(
                            row["ore_actual"] or 0
                        ),
                        2,
                    ),
                    "waste_plan": round(
                        float(
                            row["waste_plan"] or 0
                        ),
                        2,
                    ),
                    "waste_actual": round(
                        float(
                            row["waste_actual"] or 0
                        ),
                        2,
                    ),
                }
            )

        return data

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the production trend."
            ),
        ) from exc