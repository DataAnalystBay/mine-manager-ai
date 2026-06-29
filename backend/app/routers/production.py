from fastapi import APIRouter
from app.database import SessionLocal
from app.models import ProductionDaily

router = APIRouter()

@router.get("/")
def get_production():

    db = SessionLocal()

    data = db.query(ProductionDaily)\
             .order_by(ProductionDaily.report_date)\
             .all()

    result = []

    for row in data:
        result.append({
            "report_date": str(row.report_date),
            "ore_plan": float(row.ore_plan),
            "ore_actual": float(row.ore_actual),
            "gold_produced_oz": float(row.gold_produced_oz),
            "recovery_pct": float(row.recovery_pct)
        })

    db.close()

    return result