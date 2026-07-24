from app.services.ai.kpi_engine import get_kpi_intelligence
from app.services.ai.risk_engine import get_operational_risks


def get_score_from_performance(performance):
    if performance is None:
        return 0
    return min(round(performance), 100)


def get_health_category(score):
    if score >= 95:
        return "Excellent"
    elif score >= 85:
        return "Healthy"
    elif score >= 70:
        return "Watch"
    elif score >= 50:
        return "Critical"
    return "Emergency"


def get_mine_health_score():
    kpi_data = get_kpi_intelligence()
    risk_data = get_operational_risks()

    ore = kpi_data.get("ore", {})
    waste = kpi_data.get("waste", {})
    risks = risk_data.get("risks", [])

    ore_score = get_score_from_performance(ore.get("performance"))
    waste_score = get_score_from_performance(waste.get("performance"))

    production_score = round((ore_score * 0.6) + (waste_score * 0.4))

    high_risk_count = len([r for r in risks if r.get("level") == "High"])
    medium_risk_count = len([r for r in risks if r.get("level") == "Medium"])

    risk_penalty = high_risk_count * 8 + medium_risk_count * 4

    final_score = max(production_score - risk_penalty, 0)

    return {
        "engine": "Mine Health Score 2.0",
        "status": "active",
        "report_date": kpi_data.get("report_date"),
        "score": final_score,
        "category": get_health_category(final_score),
        "components": {
            "ore_score": ore_score,
            "waste_score": waste_score,
            "production_score": production_score,
            "risk_penalty": risk_penalty
        },
        "summary": (
            f"Mine Health Score is {final_score}/100. "
            f"The operation is classified as {get_health_category(final_score)}."
        )
    }