from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal

router = APIRouter(
    prefix="/api/production",
    tags=["Production"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/today")
def get_today_production(db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            report_date,
            ore_plan,
            ore_actual,
            waste_plan,
            waste_actual
        FROM production_daily
        ORDER BY report_date DESC
        LIMIT 1
    """)

    result = db.execute(query).fetchone()

    if not result:
        return {
            "message": "No production data found",
            "ore_plan": 0,
            "ore_actual": 0,
            "ore_variance": 0,
            "waste_plan": 0,
            "waste_actual": 0,
            "waste_variance": 0
        }

    ore_variance = result.ore_actual - result.ore_plan
    waste_variance = result.waste_actual - result.waste_plan

    return {
        "report_date": result.report_date,
        "ore_plan": result.ore_plan,
        "ore_actual": result.ore_actual,
        "ore_variance": ore_variance,
        "waste_plan": result.waste_plan,
        "waste_actual": result.waste_actual,
        "waste_variance": waste_variance
    }


@router.get("/trend")
def get_production_trend(db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            report_date,
            ore_plan,
            ore_actual,
            waste_plan,
            waste_actual
        FROM production_daily
        ORDER BY report_date DESC
        LIMIT 30
    """)

    results = db.execute(query).fetchall()

    data = []

    for row in reversed(results):
        data.append({
            "report_date": row.report_date,
            "ore_plan": row.ore_plan,
            "ore_actual": row.ore_actual,
            "waste_plan": row.waste_plan,
            "waste_actual": row.waste_actual
        })

    return data