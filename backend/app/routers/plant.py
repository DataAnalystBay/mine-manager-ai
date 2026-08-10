from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    get_current_user,
)
from app.database import SessionLocal


router = APIRouter(
    prefix="/api/plant",
    tags=["Plant"],
    dependencies=[
        Depends(get_current_user),
    ],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/today")
def get_today_plant(
    mine_name: str = Query(
        default="Oyu Tolgoi Surface",
        min_length=1,
        max_length=100,
    ),
    db: Session = Depends(get_db),
):
    try:
        query = text(
            """
            SELECT
                report_date,
                mine_name,
                throughput_plan,
                throughput_actual,
                recovery
            FROM plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        )

        result = db.execute(
            query,
            {
                "mine_name": mine_name.strip(),
            },
        ).mappings().first()

        if not result:
            return {
                "message": "No plant data found",
                "report_date": None,
                "mine_name": mine_name.strip(),
                "throughput_plan": 0,
                "throughput_actual": 0,
                "throughput_performance": 0,
                "throughput_variance": 0,
                "recovery": 0,
                "plant_performance": 0,
            }

        throughput_plan = float(
            result["throughput_plan"] or 0
        )

        throughput_actual = float(
            result["throughput_actual"] or 0
        )

        recovery = float(
            result["recovery"] or 0
        )

        throughput_performance = (
            throughput_actual /
            throughput_plan *
            100
            if throughput_plan > 0
            else 0
        )

        throughput_variance = (
            throughput_actual -
            throughput_plan
        )

        plant_performance = round(
            (
                throughput_performance +
                recovery
            ) / 2,
            1,
        )

        return {
            "report_date": str(
                result["report_date"]
            ),
            "mine_name": result["mine_name"],
            "throughput_plan": round(
                throughput_plan,
                1,
            ),
            "throughput_actual": round(
                throughput_actual,
                1,
            ),
            "throughput_performance": round(
                throughput_performance,
                1,
            ),
            "throughput_variance": round(
                throughput_variance,
                1,
            ),
            "recovery": round(
                recovery,
                1,
            ),
            "plant_performance": plant_performance,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the latest "
                "plant data."
            ),
        ) from exc


@router.get("/trend")
def get_plant_trend(
    mine_name: str = Query(
        default="Oyu Tolgoi Surface",
        min_length=1,
        max_length=100,
    ),
    days: int = Query(
        default=30,
        ge=1,
        le=90,
    ),
    db: Session = Depends(get_db),
):
    try:
        query = text(
            """
            SELECT
                report_date,
                mine_name,
                throughput_plan,
                throughput_actual,
                recovery
            FROM plant_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        )

        results = db.execute(
            query,
            {
                "mine_name": mine_name.strip(),
                "days": days,
            },
        ).mappings().all()

        data = []

        for row in reversed(results):
            throughput_plan = float(
                row["throughput_plan"] or 0
            )

            throughput_actual = float(
                row["throughput_actual"] or 0
            )

            recovery = float(
                row["recovery"] or 0
            )

            throughput_performance = (
                throughput_actual /
                throughput_plan *
                100
                if throughput_plan > 0
                else 0
            )

            plant_performance = round(
                (
                    throughput_performance +
                    recovery
                ) / 2,
                1,
            )

            data.append(
                {
                    "report_date": str(
                        row["report_date"]
                    ),
                    "mine_name": row["mine_name"],
                    "throughput_plan": round(
                        throughput_plan,
                        1,
                    ),
                    "throughput_actual": round(
                        throughput_actual,
                        1,
                    ),
                    "throughput_performance": round(
                        throughput_performance,
                        1,
                    ),
                    "throughput_variance": round(
                        throughput_actual -
                        throughput_plan,
                        1,
                    ),
                    "recovery": round(
                        recovery,
                        1,
                    ),
                    "plant_performance":
                        plant_performance,
                }
            )

        return data

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the "
                "plant trend."
            ),
        ) from exc