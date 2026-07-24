from datetime import date, timedelta
from typing import Dict, List


KPI_CONFIG: Dict[str, Dict] = {
    "mine_health": {
        "title": "Mine Health",
        "current_value": 87.0,
        "target": 90.0,
        "unit": "/100",
        "values": [84.0, 85.0, 86.0, 85.0, 86.0, 88.0, 87.0],
        "drivers": [
            "Fleet utilization remains below target",
            "Plant throughput has improved",
            "No recordable safety incident",
        ],
        "recommendations": [
            "Prioritize fleet availability recovery",
            "Maintain plant operating discipline",
            "Continue visible field safety leadership",
        ],
    },
    "ore": {
        "title": "Ore Performance",
        "current_value": 96.0,
        "target": 100.0,
        "unit": "%",
        "values": [99.0, 98.0, 97.0, 95.0, 94.0, 95.0, 96.0],
        "drivers": [
            "Reduced haulage capacity",
            "Short-term mining sequence constraints",
            "Weather-related road delays",
        ],
        "recommendations": [
            "Review the next 24-hour mining sequence",
            "Prioritize ore haulage equipment",
            "Confirm crusher feed continuity",
        ],
    },
    "waste": {
        "title": "Waste Movement",
        "current_value": 92.0,
        "target": 100.0,
        "unit": "%",
        "values": [101.0, 99.0, 97.0, 96.0, 94.0, 93.0, 92.0],
        "drivers": [
            "Haul road congestion",
            "Reduced truck availability",
            "Weather impact on waste routes",
        ],
        "recommendations": [
            "Prioritize critical waste routes",
            "Review truck allocation by destination",
            "Accelerate haul road recovery work",
        ],
    },
    "fleet": {
        "title": "Fleet Performance",
        "current_value": 87.0,
        "target": 90.0,
        "unit": "%",
        "values": [91.0, 90.0, 89.0, 87.0, 85.0, 86.0, 87.0],
        "drivers": [
            "Truck 102 breakdown",
            "Maintenance backlog",
            "Weather-related haulage delays",
        ],
        "recommendations": [
            "Prioritize Truck 102 repair",
            "Review dispatch allocation",
            "Increase maintenance recovery focus",
        ],
    },
    "plant": {
        "title": "Plant Performance",
        "current_value": 97.0,
        "target": 95.0,
        "unit": "%",
        "values": [94.0, 95.0, 96.0, 95.0, 96.0, 98.0, 97.0],
        "drivers": [
            "Improved crusher availability",
            "Stable mill feed",
            "Reduced unplanned downtime",
        ],
        "recommendations": [
            "Maintain current plant operating rhythm",
            "Monitor crusher constraint risk",
            "Protect planned maintenance windows",
        ],
    },
    "safety": {
        "title": "Safety Incidents",
        "current_value": 0.0,
        "target": 0.0,
        "unit": "",
        "values": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        "drivers": [
            "No recordable incidents detected",
            "Critical controls remain effective",
            "Field leadership presence remains stable",
        ],
        "recommendations": [
            "Maintain critical control verification",
            "Continue visible leadership interactions",
            "Monitor fatigue and weather exposure",
        ],
    },
}


def get_kpi_detail(
    mine_name: str,
    kpi_name: str,
    days: int = 7,
) -> Dict:
    config = KPI_CONFIG.get(kpi_name)

    if not config:
        raise ValueError(f"Unsupported KPI: {kpi_name}")

    values: List[float] = config["values"][-days:]

    start_date = date.today() - timedelta(days=len(values) - 1)

    daily_values = [
        {
            "date": (start_date + timedelta(days=index)).isoformat(),
            "value": value,
        }
        for index, value in enumerate(values)
    ]

    first_value = values[0]
    last_value = values[-1]
    change = round(last_value - first_value, 2)

    change_percent = (
        round((change / first_value) * 100, 2)
        if first_value != 0
        else 0.0
    )

    if change > 0:
        direction = "up"
    elif change < 0:
        direction = "down"
    else:
        direction = "flat"

    return {
        "kpi_name": config["title"],
        "current_value": config["current_value"],
        "target": config["target"],
        "unit": config["unit"],
        "change": change,
        "change_percent": change_percent,
        "direction": direction,
        "period_label": f"Last {len(values)} Days",
        "daily_values": daily_values,
        "top_drivers": config["drivers"],
        "recommendations": config["recommendations"],
    }