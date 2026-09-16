from types import SimpleNamespace
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.auth.dependencies import (
    require_general_manager_or_administrator,
)
from app.routers import demo


TENANT = {
    "company_id": 41,
    "mine_id": 73,
    "company_name": "Synthetic Company A",
    "mine_name": "Synthetic Mine A",
    "operation_profile": "standard_mine",
}


def _generated_demo_data():
    return {
        "production": [],
        "fleet": [],
        "plant": [],
        "safety": [],
        "maintenance": [],
        "workforce": [],
        "historical_start_date": "2026-01-01",
        "historical_end_date": "2026-01-02",
        "reporting_days": 2,
        "scenario_status": "Stable",
    }


class DemoContractTests(unittest.TestCase):
    def test_demo_load_uses_authenticated_tenant(self):
        generated_calls = []
        persistence_calls = []

        def fake_generate_all_demo_data(**kwargs):
            generated_calls.append(kwargs)
            return _generated_demo_data()

        def fake_persist_demo_data(**kwargs):
            persistence_calls.append(kwargs)
            return {
                "success": True,
                "tenant": TENANT,
            }

        with (
            patch.object(
                demo,
                "generate_all_demo_data",
                fake_generate_all_demo_data,
            ),
            patch.object(
                demo,
                "persist_demo_data",
                fake_persist_demo_data,
            ),
        ):
            response = demo.load_demo_data(
                request=demo.DemoLoadRequest(
                    scenario="High Performing Mine",
                    mine_name="Synthetic Mine B",
                ),
                tenant=TENANT,
            )

        self.assertEqual(
            generated_calls,
            [
                {
                    "scenario": "High Performing Mine",
                    "mine_name": "Synthetic Mine A",
                    "days": None,
                    "operation_profile": "standard_mine",
                }
            ],
        )
        self.assertEqual(
            persistence_calls[0]["mine_name"],
            "Synthetic Mine A",
        )
        self.assertEqual(persistence_calls[0]["company_id"], 41)
        self.assertEqual(persistence_calls[0]["mine_id"], 73)
        self.assertIs(response["success"], True)
        self.assertEqual(
            response["requested_mine_name"],
            "Synthetic Mine B",
        )
        self.assertEqual(response["mine_name"], "Synthetic Mine A")

    def test_demo_reset_reports_authenticated_tenant(self):
        response = demo.reset_demo_data(
            tenant=TENANT,
            request=demo.DemoResetRequest(
                mine_name="Synthetic Mine B",
            ),
        )

        self.assertIs(response["success"], True)
        self.assertEqual(response["mine_name"], "Synthetic Mine A")
        self.assertEqual(
            response["requested_mine_name"],
            "Synthetic Mine B",
        )
        self.assertIs(response["database_records_deleted"], False)

    def test_demo_mutation_roles_allow_management(self):
        for role in ("Administrator", "General Manager"):
            with self.subTest(role=role):
                user = SimpleNamespace(role=role)
                self.assertIs(
                    require_general_manager_or_administrator(user),
                    user,
                )

    def test_demo_mutation_roles_reject_viewer(self):
        with self.assertRaises(HTTPException) as context:
            require_general_manager_or_administrator(
                SimpleNamespace(role="Viewer")
            )

        self.assertEqual(context.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
