from app.database import SessionLocal
from sqlalchemy import text


def calculate_performance(actual, plan):
    if plan is None or plan == 0:
        return 0
    return round((actual / plan) * 100, 1)


def calculate_status(performance):
    if performance >= 100:
        return "Above Plan"
    elif performance >= 95:
        return "On Plan"
    return "Below Plan"


def calculate_severity(performance):
    if performance >= 95:
        return "Low"
    elif performance >= 90:
        return "Medium"
    return "High"


def build_kpi(plan, actual):
    performance = calculate_performance(actual, plan)
    variance = actual - plan

    return {
        "plan": plan,
        "actual": actual,
        "performance": performance,
        "variance": variance,
        "status": calculate_status(performance),
        "severity": calculate_severity(performance)
    }


def get_kpi_intelligence():
    db = SessionLocal()

    try:
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

        result = db.execute(query).mappings().first()

        if not result:
            return {
                "message": "No production data found",
                "report_date": None,
                "ore": None,
                "waste": None
            }

        return {
            "engine": "KPI Intelligence Engine",
            "status": "active",
            "report_date": str(result["report_date"]),
            "ore": build_kpi(
                result["ore_plan"],
                result["ore_actual"]
            ),
            "waste": build_kpi(
                result["waste_plan"],
                result["waste_actual"]
            )
        }

    finally:
        db.close()