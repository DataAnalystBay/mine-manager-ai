from app.services.ai.kpi_engine import get_kpi_intelligence


def get_risk_level(severity):
    if severity == "High":
        return "High"
    elif severity == "Medium":
        return "Medium"
    return "Low"


def build_risk(area, kpi):
    if not kpi:
        return None

    risk_level = get_risk_level(kpi["severity"])

    return {
        "area": area,
        "risk": f"{area} performance risk",
        "level": risk_level,
        "probability": 85 if risk_level == "High" else 60 if risk_level == "Medium" else 25,
        "impact": "High" if risk_level == "High" else "Medium" if risk_level == "Medium" else "Low",
        "reason": f"{area} achieved {kpi['performance']}% of plan with variance {kpi['variance']}.",
        "recommended_action": (
            f"Immediate review required for {area.lower()} performance."
            if risk_level == "High"
            else f"Monitor {area.lower()} performance and validate shift constraints."
            if risk_level == "Medium"
            else f"{area} performance is stable. Continue monitoring."
        )
    }


def get_operational_risks():
    kpi_data = get_kpi_intelligence()

    ore_risk = build_risk("Ore Production", kpi_data.get("ore"))
    waste_risk = build_risk("Waste Movement", kpi_data.get("waste"))

    risks = [risk for risk in [ore_risk, waste_risk] if risk]

    return {
        "engine": "Operational Risk Engine",
        "status": "active",
        "report_date": kpi_data.get("report_date"),
        "risk_count": len(risks),
        "risks": risks
    }