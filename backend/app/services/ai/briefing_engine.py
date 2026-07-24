from app.services.ai.kpi_engine import get_kpi_intelligence
from app.services.ai.risk_engine import get_operational_risks
from app.services.ai.recommendation_engine import get_recommendations


def get_daily_briefing():
    kpi_data = get_kpi_intelligence()
    risk_data = get_operational_risks()
    recommendation_data = get_recommendations()

    ore = kpi_data.get("ore", {})
    waste = kpi_data.get("waste", {})
    risks = risk_data.get("risks", [])
    recommendations = recommendation_data.get("recommendations", [])

    high_risks = [r for r in risks if r.get("level") == "High"]
    medium_risks = [r for r in risks if r.get("level") == "Medium"]

    if high_risks:
        overall_status = "Attention Required"
    elif medium_risks:
        overall_status = "Monitor Closely"
    else:
        overall_status = "Stable"

    summary = (
        f"Ore production achieved {ore.get('performance')}% of plan, "
        f"while waste movement achieved {waste.get('performance')}% of plan. "
        f"The operation is currently classified as {overall_status}."
    )

    return {
        "engine": "AI Daily Briefing",
        "status": "active",
        "report_date": kpi_data.get("report_date"),
        "overall_status": overall_status,
        "summary": summary,
        "top_risks": risks[:3],
        "priority_actions": recommendations[:3],
        "manager_note": (
            "Focus today’s leadership discussion on the highest-risk production constraints "
            "and assign clear owners for priority actions."
        )
    }