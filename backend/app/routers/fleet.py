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
    prefix="/api/fleet",
    tags=["Fleet"],
    dependencies=[
        Depends(get_current_user),
    ],
)


def get_db():
    """
    Provide a database session and close it
    after the request.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/today")
def get_today_fleet(
    mine_name: str = Query(
        default="Oyu Tolgoi Surface",
        min_length=1,
        max_length=100,
    ),
    db: Session = Depends(get_db),
):
    """
    Return the latest available Fleet record
    for the selected mine.
    """

    try:
        query = text(
            """
            SELECT
                report_date,
                mine_name,
                availability,
                utilization
            FROM fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT 1
            """
        )

        result = db.execute(
            query,
            {
                "mine_name":
                    mine_name.strip(),
            },
        ).mappings().first()

        if not result:
            return {
                "message":
                    "No fleet data found",
                "report_date": None,
                "mine_name":
                    mine_name.strip(),
                "availability": 0,
                "utilization": 0,
                "fleet_performance": 0,
            }

        availability = float(
            result["availability"] or 0
        )

        utilization = float(
            result["utilization"] or 0
        )

        fleet_performance = round(
            (
                availability +
                utilization
            ) / 2,
            1,
        )

        return {
            "report_date": str(
                result["report_date"]
            ),
            "mine_name":
                result["mine_name"],
            "availability": round(
                availability,
                1,
            ),
            "utilization": round(
                utilization,
                1,
            ),
            "fleet_performance":
                fleet_performance,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the latest "
                "fleet data."
            ),
        ) from exc


@router.get("/trend")
def get_fleet_trend(
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
    """
    Return recent Fleet records in
    chronological order.
    """

    try:
        query = text(
            """
            SELECT
                report_date,
                mine_name,
                availability,
                utilization
            FROM fleet_daily
            WHERE mine_name = :mine_name
            ORDER BY report_date DESC
            LIMIT :days
            """
        )

        results = db.execute(
            query,
            {
                "mine_name":
                    mine_name.strip(),
                "days": days,
            },
        ).mappings().all()

        data = []

        for row in reversed(results):
            availability = float(
                row["availability"] or 0
            )

            utilization = float(
                row["utilization"] or 0
            )

            data.append(
                {
                    "report_date": str(
                        row["report_date"]
                    ),
                    "mine_name":
                        row["mine_name"],
                    "availability": round(
                        availability,
                        1,
                    ),
                    "utilization": round(
                        utilization,
                        1,
                    ),
                    "fleet_performance":
                        round(
                            (
                                availability +
                                utilization
                            ) / 2,
                            1,
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
                "Unable to load the "
                "fleet trend."
            ),
        ) from exc