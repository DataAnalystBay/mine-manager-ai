from types import SimpleNamespace
import unittest

from fastapi import HTTPException

from app.auth.dependencies import require_administrator
from app.auth.security import verify_password
from app.models.auth_company import Company
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.models.user import User
from app.routers.auth import login_user
from app.routers.users import list_company_users
from app.scripts.seed_coal_surface_demo import provision_administrator
from app.services.tenant_service import resolve_authenticated_tenant


class _Query:
    def __init__(self, rows):
        self.rows = rows
        self.criteria = []

    def filter(self, *criteria):
        self.criteria.extend(criteria)
        return self

    def first(self):
        for row in self.rows:
            if all(self._matches(row, criterion) for criterion in self.criteria):
                return row
        return None

    def order_by(self, *criteria):
        return self

    def all(self):
        return [
            row
            for row in self.rows
            if all(self._matches(row, criterion) for criterion in self.criteria)
        ]

    @staticmethod
    def _matches(row, criterion):
        left = getattr(criterion, "left", None)
        right = getattr(criterion, "right", None)
        key = getattr(left, "key", None)
        expected = getattr(right, "value", None)
        return key is None or getattr(row, key, None) == expected


class _Db:
    def __init__(self, rows_by_model):
        self.rows_by_model = rows_by_model

    def query(self, model):
        return _Query(self.rows_by_model.get(model, []))

    def add(self, row):
        rows = self.rows_by_model.setdefault(type(row), [])
        if getattr(row, "id", None) is None:
            row.id = len(rows) + 1
        rows.append(row)

    def flush(self):
        return None


class CoalAdministratorTests(unittest.TestCase):
    def setUp(self):
        self.password = "runtime-test-password"
        self.coal_auth = Company(
            id=3,
            company_name="Coal Mining Demo",
            mine_name="Coal Surface Operations",
            is_active=True,
        )
        self.oyu_auth = Company(
            id=1,
            company_name="Oyu Tolgoi LLC",
            mine_name="Oyu Tolgoi Surface",
            is_active=True,
        )
        self.coal_company = SimpleNamespace(
            id=3,
            company_name="Coal Mining Demo",
            company_name_en="Coal Mining Demo",
            company_name_mn="Нүүрсний уурхайн демо",
        )
        self.oyu_company = SimpleNamespace(
            id=1,
            company_name="Oyu Tolgoi LLC",
            company_name_en="Oyu Tolgoi LLC",
            company_name_mn=None,
        )
        self.coal_mine = SimpleNamespace(
            id=3,
            company_id=3,
            mine_name="Coal Surface Operations",
            mine_name_en="Coal Surface Operations",
            mine_name_mn="Нүүрсний ил уурхайн үйл ажиллагаа",
            mine_type="Coal Surface Mining",
        )
        self.oyu_mine = SimpleNamespace(
            id=1,
            company_id=1,
            mine_name="Oyu Tolgoi Surface",
            mine_name_en="Oyu Tolgoi Surface",
            mine_name_mn=None,
            mine_type="Open Pit",
        )
        self.db = _Db(
            {
                Company: [self.coal_auth, self.oyu_auth],
                User: [],
                CompanySettings: [self.coal_company, self.oyu_company],
                MineSettings: [self.coal_mine, self.oyu_mine],
            }
        )

    def test_coal_administrator_is_idempotent_and_authenticates(self):
        first = provision_administrator(
            self.db,
            self.coal_auth,
            "coal.admin@example.test",
            self.password,
            "Coal Administrator",
        )
        original_hash = first.hashed_password
        second = provision_administrator(
            self.db,
            self.coal_auth,
            "COAL.ADMIN@example.test",
            "different-runtime-password",
            "Coal Administrator",
        )

        self.assertIs(first, second)
        self.assertEqual(len(self.db.rows_by_model[User]), 1)
        self.assertEqual(second.hashed_password, original_hash)
        self.assertTrue(verify_password(self.password, second.hashed_password))

        second.company = self.coal_auth
        response = login_user(
            SimpleNamespace(
                username="coal.admin@example.test",
                password=self.password,
            ),
            self.db,
        )
        self.assertEqual(response["role"], "Administrator")
        self.assertEqual(response["company_id"], 3)
        self.assertIs(require_administrator(second), second)

    def test_coal_administrator_resolves_only_coal_tenant(self):
        user = provision_administrator(
            self.db,
            self.coal_auth,
            "coal.admin@example.test",
            self.password,
        )
        user.company = self.coal_auth
        tenant = resolve_authenticated_tenant(self.db, user)

        self.assertEqual(tenant["company_name"], "Coal Mining Demo")
        self.assertEqual(tenant["mine_name"], "Coal Surface Operations")
        self.assertEqual(tenant["operation_profile"], "coal_surface_v1")
        self.assertEqual(tenant["company_id"], 3)
        self.assertEqual(tenant["mine_id"], 3)
        self.assertNotEqual(tenant["company_id"], self.oyu_company.id)
        self.assertNotEqual(tenant["mine_id"], self.oyu_mine.id)

    def test_administrator_endpoint_lists_only_coal_company_users(self):
        coal_admin = SimpleNamespace(
            id=10,
            company_id=3,
            full_name="Coal Administrator",
        )
        coal_manager = SimpleNamespace(
            id=11,
            company_id=3,
            full_name="Coal General Manager",
        )
        oyu_admin = SimpleNamespace(
            id=12,
            company_id=1,
            full_name="Oyu Administrator",
        )
        self.db.rows_by_model[User].extend(
            [coal_admin, coal_manager, oyu_admin]
        )

        users = list_company_users(self.db, coal_admin)

        self.assertEqual([user.id for user in users], [10, 11])

    def test_existing_coal_general_manager_is_unchanged(self):
        general_manager = SimpleNamespace(
            id=20,
            company_id=3,
            email="coal.gm@example.test",
            role="General Manager",
            is_active=True,
        )
        self.db.rows_by_model[User].append(general_manager)

        provision_administrator(
            self.db,
            self.coal_auth,
            "coal.admin@example.test",
            self.password,
        )

        self.assertEqual(general_manager.role, "General Manager")
        self.assertTrue(general_manager.is_active)

    def test_email_owned_by_another_tenant_is_rejected(self):
        other_user = SimpleNamespace(
            id=30,
            company_id=1,
            email="existing@example.test",
            role="Administrator",
            is_active=True,
        )
        self.db.rows_by_model[User].append(other_user)

        with self.assertRaises(RuntimeError):
            provision_administrator(
                self.db,
                self.coal_auth,
                other_user.email,
                self.password,
            )

        self.assertEqual(other_user.company_id, 1)

    def test_non_administrator_is_still_rejected_by_admin_rbac(self):
        with self.assertRaises(HTTPException) as context:
            require_administrator(SimpleNamespace(role="General Manager"))
        self.assertEqual(context.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
