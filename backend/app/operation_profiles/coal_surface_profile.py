"""Configuration contract for the reusable V1.0 coal-surface profile."""

PROFILE_CODE = "coal_surface_v1"

COAL_SURFACE_PROFILE = {
    "code": PROFILE_CODE,
    "name": "Coal Surface Mining — Demo v1.0",
    "commodity": "Coal",
    "mining_method": "Open Pit / Surface",
    "operation_type": "Mining + Coal Handling / Processing",
    "processing_route": "ROM Coal → CHPP → Product Coal",
    "operating_schedule": "24/7 continuous",
    "shift_length_hours": 12,
    "shifts_per_day": 2,
    "primary_production_unit": "t",
    "waste_unit": "bcm",
    "timezone": "Asia/Ulaanbaatar",
    "languages": ["en", "mn"],
    "value_chain": [
        "Drill & Blast", "Waste Removal", "Coal Exposure", "Coal Mining",
        "ROM Stockpile", "CHPP", "Product Coal", "Dispatch",
    ],
    "modules": {"production": True, "fleet": True, "plant": True,
                "safety": True, "coal_quality": True},
    "health_weights": {"production": .30, "fleet": .20, "plant": .20,
                       "safety": .20, "coal_quality": .10},
    "kpis": [
        ("rom_coal_production", "ROM Coal Production", "production", 12000, "t/day", "higher_is_better", True),
        ("product_coal", "Product Coal", "production", 10500, "t/day", "higher_is_better", False),
        ("waste_movement", "Waste Movement", "production", 48000, "bcm/day", "higher_is_better", True),
        ("stripping_ratio", "Stripping Ratio", "production", 3.75, "bcm/t", "lower_is_better", False),
        ("mining_plan_compliance", "Mining Plan Compliance", "production", 95, "%", "higher_is_better", False),
        ("coal_recovery", "Coal Recovery", "production", 92, "%", "higher_is_better", False),
        ("fleet_availability", "Fleet Availability", "fleet", 90, "%", "higher_is_better", True),
        ("fleet_utilisation", "Fleet Utilisation", "fleet", 82, "%", "higher_is_better", False),
        ("haul_cycle_time", "Haul Cycle Time", "fleet", None, "min", "lower_is_better", False),
        ("truck_productivity", "Truck Productivity", "fleet", None, "t/h", "higher_is_better", False),
        ("excavator_productivity", "Excavator Productivity", "fleet", None, "t/h", "higher_is_better", False),
        ("fuel_efficiency", "Fuel Efficiency", "fleet", None, "L/t", "lower_is_better", False),
        ("plant_availability", "Plant Availability", "plant", 92, "%", "higher_is_better", True),
        ("plant_utilisation", "Plant Utilisation", "plant", 85, "%", "higher_is_better", False),
        ("throughput", "Throughput", "plant", 850, "t/h", "higher_is_better", False),
        ("plant_coal_recovery", "Coal Recovery", "plant", 90, "%", "higher_is_better", False),
        ("product_yield", "Product Yield", "plant", None, "%", "higher_is_better", False),
        ("unplanned_downtime", "Unplanned Downtime", "plant", None, "h", "lower_is_better", False),
        ("ash", "Ash", "quality", 15, "%", "lower_is_better", False),
        ("total_moisture", "Total Moisture", "quality", 12, "%", "lower_is_better", False),
        ("calorific_value", "Calorific Value", "quality", 5500, "kcal/kg", "higher_is_better", False),
        ("product_specification_compliance", "Product Specification Compliance", "quality", 95, "%", "higher_is_better", False),
        ("serious_safety_incidents", "Serious Safety Incidents", "safety", 0, "count", "lower_is_better", True),
    ],
    "thresholds": {
        "rom_coal_production": {"warning": 95, "critical": 90, "basis": "percent_of_plan"},
        "waste_movement": {"warning": 95, "critical": 90, "basis": "percent_of_plan"},
        "fleet_availability": {"warning": 90, "critical": 85},
        "plant_availability": {"warning": 92, "critical": 87},
        "ash": {"warning": 15, "critical": 17},
        "total_moisture": {"warning": 12, "critical": 14},
        "calorific_value": {"warning": 5500, "critical": 5200},
        "serious_safety_incidents": {"warning": 0, "critical": 0},
    },
}

def evaluate_status(value, warning, critical, direction="higher_is_better"):
    """Apply direction-aware good/warning/critical boundaries."""
    value, warning, critical = float(value), float(warning), float(critical)
    if direction == "lower_is_better":
        return "critical" if value > critical else ("warning" if value > warning else "good")
    return "critical" if value < critical else ("warning" if value < warning else "good")
