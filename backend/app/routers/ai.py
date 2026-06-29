from fastapi import APIRouter
from sqlalchemy import text

from app.database import SessionLocal

router = APIRouter(
    prefix="/ai",
    tags=["AI Insights"]
)

@router.get("/")
def get_ai_insights():

    db = SessionLocal()

    try:
        result = db.execute(text("""
            SELECT
                SUM(ore_actual) AS total_ore,
                SUM(waste_actual) AS total_waste
            FROM operations.production_daily
        """))

        row = result.fetchone()

        return {
            "total_ore": float(row.total_ore or 0),
            "total_waste": float(row.total_waste or 0),
            "insight": "Production data successfully analyzed"
        }

    finally:
        db.close()