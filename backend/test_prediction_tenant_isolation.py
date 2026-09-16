from types import SimpleNamespace
import unittest
from unittest.mock import ANY, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.routers import predictions


TENANTS = {
    1: {
        "auth_company_id": 1,
        "company_id": 1,
        "mine_id": 1,
        "company_name": "Oyu Tolgoi LLC",
        "mine_name": "Oyu Tolgoi Surface",
        "mine_name_en": "Oyu Tolgoi Surface",
        "mine_name_mn": None,
        "mine_type": "Open Pit",
        "operation_profile": "open_pit",
    },
    2: {
        "auth_company_id": 2,
        "company_id": 2,
        "mine_id": 2,
        "company_name": "Achit-Ikht LLC",
        "mine_name": "Achit-Ikht Copper Cathode Operation",
        "mine_name_en": "Achit-Ikht Copper Cathode Operation",
        "mine_name_mn": "Ачит-Ихт Зэсийн Катодын Үйлдвэр",
        "mine_type": "Processing Plant / SX-EW",
        "operation_profile": "sxew_copper",
    },
    3: {
        "auth_company_id": 3,
        "company_id": 3,
        "mine_id": 3,
        "company_name": "Coal Mining Demo",
        "mine_name": "Coal Surface Operations",
        "mine_name_en": "Coal Surface Operations",
        "mine_name_mn": "Нүүрсний ил уурхайн үйл ажиллагаа",
        "mine_type": "Coal Surface Mining",
        "operation_profile": "coal_surface_v1",
    },
}


def _user(company_id, role):
    return SimpleNamespace(company_id=company_id, role=role)


def _history(tenant):
    rows = []
    for index in range(5):
        rows.append(
            {
                "report_date": f"2026-09-{index + 1:02d}",
                "health": 80 + index,
                "ore": 90 + index,
                "waste": 88 + index,
                "fleet": 86 + index,
                "plant": 89 + index,
                "throughput": 91 + index,
                "recovery": 84 + index,
                "safety_score": 95 + index,
                "operation_profile": tenant["operation_profile"],
            }
        )
    return {
        "company_id": tenant["company_id"],
        "mine_id": tenant["mine_id"],
        "mine_name": tenant["mine_name"],
        "history": rows,
    }


class PredictionTenantIsolationTests(unittest.TestCase):
    def _resolve(self, company_id, requested=None, role="General Manager"):
        user = _user(company_id, role)
        with patch.object(
            predictions,
            "resolve_authenticated_tenant",
            return_value=TENANTS[company_id],
        ) as resolver:
            result = predictions.resolve_prediction_tenant(
                db=object(),
                current_user=user,
                mine_name=requested,
            )
        resolver.assert_called_once_with(db=ANY, current_user=user)
        return result

    def test_coal_achit_and_oyu_resolve_only_authenticated_tenant(self):
        for company_id, tenant in TENANTS.items():
            with self.subTest(company_id=company_id):
                result = self._resolve(company_id, tenant["mine_name"])
                self.assertEqual(result["company_id"], company_id)
                self.assertEqual(result["mine_id"], tenant["mine_id"])
                self.assertEqual(result["mine_name"], tenant["mine_name"])
                self.assertEqual(
                    result["operation_profile"],
                    tenant["operation_profile"],
                )

    def test_cross_tenant_mine_name_is_rejected(self):
        for company_id, other_company_id in ((1, 2), (2, 3), (3, 1)):
            with self.subTest(company_id=company_id):
                with self.assertRaises(HTTPException) as context:
                    self._resolve(
                        company_id,
                        TENANTS[other_company_id]["mine_name"],
                    )
                self.assertEqual(context.exception.status_code, 403)

    def test_administrator_and_general_manager_are_both_tenant_scoped(self):
        for role in ("Administrator", "General Manager"):
            with self.subTest(role=role):
                result = self._resolve(3, role=role)
                self.assertEqual(result["company_name"], "Coal Mining Demo")
                self.assertEqual(result["mine_name"], "Coal Surface Operations")

    def test_summary_uses_company_and_mine_ids_for_history(self):
        expected_response_keys = {
            "company_id", "mine_id", "company_name", "mine_name",
            "mine_type", "operation_profile", "operation_profile_name",
            "applicability", "forecast_horizon", "overall_outlook",
            "overall_confidence", "executive_message", "data_quality",
            "available_prediction_count", "applicable_prediction_count",
            "predictions", "status",
        }

        for company_id, tenant in TENANTS.items():
            with self.subTest(company_id=company_id):
                user = _user(company_id, "General Manager")
                with (
                    patch.object(
                        predictions,
                        "resolve_authenticated_tenant",
                        return_value=tenant,
                    ),
                    patch.object(
                        predictions,
                        "get_health_history_service",
                        return_value=_history(tenant),
                    ) as history,
                ):
                    response = predictions.get_prediction_summary(
                        mine_name=tenant["mine_name"],
                        db=object(),
                        current_user=user,
                    )

                history.assert_called_once_with(
                    mine_name=tenant["mine_name"],
                    db=ANY,
                    company_id=tenant["company_id"],
                    mine_id=tenant["mine_id"],
                    operation_profile=tenant["operation_profile"],
                )
                self.assertEqual(set(response), expected_response_keys)
                self.assertEqual(response["company_id"], company_id)
                self.assertEqual(response["mine_id"], tenant["mine_id"])
                self.assertEqual(response["mine_name"], tenant["mine_name"])

    def test_unauthenticated_prediction_request_is_rejected(self):
        response = TestClient(app).get("/api/predictions/summary")
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
