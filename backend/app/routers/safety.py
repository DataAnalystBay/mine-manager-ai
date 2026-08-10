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
    prefix="/api/safety",
    tags=["Safety"],
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
def get_today_safety(
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
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM safety_daily
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
                    "No safety data found",
                "report_date": None,
                "mine_name":
                    mine_name.strip(),
                "incidents": 0,
                "near_misses": 0,
                "critical_risks": 0,
                "safety_score": 0,
            }

        return {
            "report_date": str(
                result["report_date"]
            ),
            "mine_name":
                result["mine_name"],
            "incidents": int(
                result["incidents"] or 0
            ),
            "near_misses": int(
                result["near_misses"] or 0
            ),
            "critical_risks": int(
                result["critical_risks"] or 0
            ),
            "safety_score": round(
                float(
                    result["safety_score"]
                    or 0
                ),
                1,
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Unable to load the latest "
                "safety data."
            ),
        ) from exc


@router.get("/trend")
def get_safety_trend(
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
                incidents,
                near_misses,
                critical_risks,
                safety_score
            FROM safety_daily
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
            data.append(
                {
                    "report_date": str(
                        row["report_date"]
                    ),
                    "mine_name":
                        row["mine_name"],
                    "incidents": int(
                        row["incidents"] or 0
                    ),
                    "near_misses": int(
                        row["near_misses"] or 0
                    ),
                    "critical_risks": int(
                        row["critical_risks"]
                        or 0
                    ),
                    "safety_score": round(
                        float(
                            row["safety_score"]
                            or 0
                        ),
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
                "safety trend."
            ),
        ) from exc