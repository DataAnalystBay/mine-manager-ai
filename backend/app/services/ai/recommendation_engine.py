from app.services.ai.risk_engine import get_operational_risks


def build_recommendation(risk):
    level = risk.get("level")
    area = risk.get("area")

    if level == "High":
        priority = "Critical"
        timeframe = "Now"
        expected_impact = "+3–5% production recovery"
        action = f"Immediately investigate {area.lower()} performance and assign an owner before the next shift."
    elif level == "Medium":
        priority = "High"
        timeframe = "Today"
        expected_impact = "+1–3% performance recovery"
        action = f"Review {area.lower()} constraints during today’s operations meeting."
    else:
        priority = "Low"
        timeframe = "Ongoing"
        expected_impact = "Maintain stable performance"
        action = f"Continue monitoring {area.lower()} performance."

    return {
        "category": area,
        "priority": priority,
        "title": f"Improve {area}",
        "action": action,
        "reason": risk.get("reason"),
        "expected_impact": expected_impact,
        "timeframe": timeframe
    }


def get_recommendations():
    risk_data = get_operational_risks()
    risks = risk_data.get("risks", [])

    recommendations = [
        build_recommendation(risk)
        for risk in risks
    ]

    return {
        "engine": "Recommendation Engine",
        "status": "active",
        "report_date": risk_data.get("report_date"),
        "recommendation_count": len(recommendations),
        "recommendations": recommendations
    }