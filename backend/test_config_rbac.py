from __future__ import annotations

from datetime import time
from decimal import Decimal
import unittest

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.auth.dependencies import (
    get_current_user,
    require_administrator,
)
from app.database import get_db
from app.models.alert_threshold import AlertThreshold
from app.models.auth_company import Company
from app.models.company import CompanySettings
from app.models.kpi_target import KpiTarget
from app.models.mine import MineSettings
from app.models.shift_pattern import ShiftPattern
from app.models.user import User
from app.routers import config


class FakeQuery:
    def __init__(self, records):
        self.records = list(records)

    def filter(self, *criteria):
        for criterion in criteria:
            key = criterion.left.key
            value = criterion.right.value
            self.records = [
                record
                for record in self.records
                if getattr(record, key) == value
            ]
        return self

    def order_by(self, *_clauses):
        return self

    def first(self):
        return self.records[0] if self.records else None

    def all(self):
        return self.records


class FakeSession:
    def __init__(self, records):
        self.records = records
        self.commits = 0

    def query(self, model):
        return FakeQuery(self.records.get(model, []))

    def commit(self):
        self.commits += 1

    def refresh(self, _record):
        return None


def make_user(role: str, company_id: int = 1) -> User:
    return User(
        id=100 + company_id,
        company_id=company_id,
        full_name=f"{role} User",
        email=f"{role.replace(' ', '.').lower()}@example.test",
        hashed_password="not-used",
        role=role,
        is_active=True,
    )


class ConfigRbacTests(unittest.TestCase):
    def setUp(self):
        auth_company_a = Company(
            id=1,
            company_name="Tenant A",
            mine_name="Mine A",
            is_active=True,
        )
        auth_company_b = Company(
            id=2,
            company_name="Tenant B",
            mine_name="Mine B",
            is_active=True,
        )
        company_a = CompanySettings(
            id=10,
            company_name="Tenant A",
            primary_color="#111111",
            secondary_color="#222222",
            timezone="UTC",
            language="English",
        )
        company_b = CompanySettings(
            id=20,
            company_name="Tenant B",
            primary_color="#333333",
            secondary_color="#444444",
            timezone="UTC",
            language="English",
        )
        mine_a = MineSettings(
            id=100,
            company_id=10,
            mine_name="Mine A",
            site_code="A",
        )
        mine_b = MineSettings(
            id=200,
            company_id=20,
            mine_name="Mine B",
            site_code="B",
        )
        kpi_a = KpiTarget(
            id=1000,
            mine_id=100,
            kpi_name="Production",
            target_value=Decimal("95.00"),
        )
        kpi_b = KpiTarget(
            id=2000,
            mine_id=200,
            kpi_name="Production",
            target_value=Decimal("90.00"),
        )
        alert_a = AlertThreshold(
            id=1100,
            mine_id=100,
            alert_name="Production alert",
            warning_value=Decimal("90.00"),
            critical_value=Decimal("80.00"),
        )
        alert_b = AlertThreshold(
            id=2100,
            mine_id=200,
            alert_name="Production alert",
            warning_value=Decimal("85.00"),
            critical_value=Decimal("75.00"),
        )
        shift_a = ShiftPattern(
            id=1200,
            mine_id=100,
            shift_name="Day",
            start_time=time(8, 0),
            end_time=time(20, 0),
            is_active=True,
        )
        shift_b = ShiftPattern(
            id=2200,
            mine_id=200,
            shift_name="Night",
            start_time=time(20, 0),
            end_time=time(8, 0),
            is_active=True,
        )
        self.company_a = company_a
        self.mine_a = mine_a
        self.kpi_a = kpi_a
        self.kpi_b = kpi_b
        self.alert_a = alert_a
        self.shift_a = shift_a
        self.db = FakeSession(
            {
                Company: [auth_company_a, auth_company_b],
                CompanySettings: [company_a, company_b],
                MineSettings: [mine_a, mine_b],
                KpiTarget: [kpi_a, kpi_b],
                AlertThreshold: [alert_a, alert_b],
                ShiftPattern: [shift_a, shift_b],
            }
        )
        self.current_user = make_user("Viewer")

        app = FastAPI()
        app.include_router(config.router)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = (
            lambda: self.current_user
        )
        self.app = app
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()

    def test_viewer_can_read_all_configuration_resources(self):
        for path in (
            "/api/config/company",
            "/api/config/mine",
            "/api/config/kpi-targets",
            "/api/config/alert-thresholds",
            "/api/config/shift-patterns",
            "/api/config/full",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200, response.text)

    def test_viewer_cannot_mutate_any_configuration_resource(self):
        original_values = (
            self.company_a.primary_color,
            self.mine_a.site_code,
            self.kpi_a.target_value,
            self.alert_a.warning_value,
            self.shift_a.shift_name,
        )
        mutations = (
            (
                "put",
                "/api/config/company",
                {"json": {"primary_color": "#abcdef"}},
            ),
            (
                "post",
                "/api/config/logo",
                {
                    "files": {
                        "file": ("logo.png", b"not-written", "image/png")
                    }
                },
            ),
            (
                "put",
                "/api/config/mine",
                {"json": {"site_code": "CHANGED"}},
            ),
            (
                "put",
                "/api/config/kpi-targets/1000",
                {"json": {"target_value": 1}},
            ),
            (
                "put",
                "/api/config/alert-thresholds/1100",
                {"json": {"warning_value": 1}},
            ),
            (
                "put",
                "/api/config/shift-patterns/1200",
                {"json": {"shift_name": "CHANGED"}},
            ),
        )

        for method, path, kwargs in mutations:
            with self.subTest(path=path):
                response = getattr(self.client, method)(path, **kwargs)
                self.assertEqual(response.status_code, 403, response.text)

        self.assertEqual(
            (
                self.company_a.primary_color,
                self.mine_a.site_code,
                self.kpi_a.target_value,
                self.alert_a.warning_value,
                self.shift_a.shift_name,
            ),
            original_values,
        )
        self.assertEqual(self.db.commits, 0)

    def test_administrator_can_update_company_configuration(self):
        self.current_user = make_user("Administrator")

        response = self.client.put(
            "/api/config/company",
            json={"primary_color": "#abcdef"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.company_a.primary_color, "#abcdef")
        self.assertEqual(self.db.commits, 1)

    def test_administrator_cannot_update_another_tenants_item(self):
        self.current_user = make_user("Administrator", company_id=1)
        original_target = self.kpi_b.target_value

        response = self.client.put(
            "/api/config/kpi-targets/2000",
            json={"target_value": 1},
        )

        self.assertEqual(response.status_code, 404, response.text)
        self.assertEqual(self.kpi_b.target_value, original_target)
        self.assertEqual(self.db.commits, 0)

    def test_unauthenticated_mutation_is_rejected(self):
        self.app.dependency_overrides.pop(get_current_user)

        response = self.client.put(
            "/api/config/company",
            json={"primary_color": "#abcdef"},
        )

        self.assertEqual(response.status_code, 401, response.text)
        self.assertEqual(self.db.commits, 0)

    def test_configuration_mutations_preserve_admin_only_policy(self):
        administrator = make_user("Administrator")
        self.assertIs(require_administrator(administrator), administrator)

        for role in (
            "General Manager",
            "Mine Manager",
            "Superintendent",
            "Viewer",
        ):
            with self.subTest(role=role):
                with self.assertRaises(HTTPException) as context:
                    require_administrator(make_user(role))
                self.assertEqual(context.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
