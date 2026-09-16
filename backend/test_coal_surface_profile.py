from app.operation_profiles.coal_surface_profile import COAL_SURFACE_PROFILE, evaluate_status
from app.services.demo_data_service import generate_all_demo_data
from app.services.kpi_calculation_service import (
    calculate_coal_quality_summary,
    calculate_health_score,
)
from app.services.executive_summary_service_v2 import _get_coal_surface_summary

def test_threshold_directions_and_demo_acceptance_values():
    assert evaluate_status(14.2, 15, 17, "lower_is_better") == "good"
    assert evaluate_status(18, 15, 17, "lower_is_better") == "critical"
    assert evaluate_status(84, 90, 85) == "critical"
    data = generate_all_demo_data(mine_name="Any configured coal mine", days=30,
                                  operation_profile="coal_surface_v1")
    assert len(data["production"]) == 30
    assert data["production"][-1]["ore_actual"] == 10980
    assert data["production"][-1]["waste_actual"] == 45000
    assert data["fleet"][-1]["availability"] == 84
    assert data["plant"][-1]["availability"] == 91
    assert data["production"][-1]["ash_pct"] == 14.2
    assert data["production"][-1]["moisture_pct"] == 10.8
    assert data["production"][-1]["calorific_value"] == 5630
    assert data["safety"][-1]["recordable_incidents"] == 0

def test_coal_health_weights_are_profile_scoped():
    score = calculate_health_score(91.5, 93.8, 83, 91, 100,
                                   operation_profile="coal_surface_v1", quality_score=100)
    assert score == 92.2
    assert sum(COAL_SURFACE_PROFILE["health_weights"].values()) == 1


def test_partial_coal_quality_values_are_null_safe():
    cases = [
        ({"ash_pct": 14.2}, {"ash": 14.2}, 100),
        ({"moisture_pct": 10.8}, {"total_moisture": 10.8}, 100),
        ({"calorific_value": 5630}, {"calorific_value": 5630.0}, 100),
        (
            {
                "ash_pct": 14.2,
                "moisture_pct": 10.8,
                "calorific_value": 5630,
            },
            {
                "ash": 14.2,
                "total_moisture": 10.8,
                "calorific_value": 5630.0,
            },
            100,
        ),
        ({}, {}, None),
    ]

    for supplied, expected_values, expected_score in cases:
        result = calculate_coal_quality_summary(**supplied)
        assert result["score"] == expected_score
        assert {
            key: value
            for key, value in result["values"].items()
            if value is not None
        } == expected_values

def test_requested_latest_statuses():
    assert evaluate_status(10980 / 12000 * 100, 95, 90) == "warning"
    assert evaluate_status(45000 / 48000 * 100, 95, 90) == "warning"
    assert evaluate_status(84, 90, 85) == "critical"
    assert evaluate_status(91, 92, 87) == "warning"
    assert evaluate_status(14.2, 15, 17, "lower_is_better") == "good"
    assert evaluate_status(10.8, 12, 14, "lower_is_better") == "good"
    assert evaluate_status(5630, 5500, 5200) == "good"
    assert evaluate_status(0, 0, 0, "lower_is_better") == "good"

def test_ai_context_is_coal_only_and_tenant_parameters_are_bound():
    class Result:
        def __init__(self, rows): self.rows = rows
        def mappings(self): return self
        def first(self):
            return self.rows[0] if self.rows else None
        def all(self): return self.rows
    class DB:
        params = []
        def execute(self, query, params):
            self.params.append(params)
            if "FROM public.kpi_targets" in str(query):
                return Result([{"kpi_code": "fleet_availability", "target_value": 91}])
            return Result([{"report_date": "2026-09-15", "ore_plan": 12000, "ore_actual": 10980,
                           "waste_plan": 48000, "waste_actual": 45000, "ash_pct": 14.2,
                           "moisture_pct": 10.8, "calorific_value": 5630,
                           "fleet_availability": 84, "plant_availability": 91}])
    db = DB()
    result = _get_coal_surface_summary(db, 31, 47, "Configured Mine", "en", "now")
    assert db.params == [{"company_id": 31, "mine_id": 47}, {"mine_id": 47}]
    assert result["operational_context"]["fleet_availability_target_pct"] == 91
    text = result["executive_headline"].lower()
    assert "coal" in text and "fleet availability" in text
    assert all(word not in text for word in ("copper", "concentrator", "oyu", "achit"))
