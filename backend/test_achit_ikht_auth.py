from types import SimpleNamespace
import unittest

from fastapi import HTTPException

from app.auth.security import hash_password, verify_password
from app.models.auth_company import Company
from app.models.company import CompanySettings
from app.models.mine import MineSettings
from app.models.user import User
from app.routers.auth import login_user
from app.scripts.seed_achit_ikht_demo import (
    DEMO_USER_EMAIL,
    DEMO_USER_PASSWORD,
    get_or_create_company,
    get_or_create_mine,
    seed_authentication,
)
from app.services.tenant_service import resolve_authenticated_tenant


VALID_PASSWORD = DEMO_USER_PASSWORD


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
        model = type(row)
        rows = self.rows_by_model.setdefault(model, [])
        if getattr(row, "id", None) is None:
            row.id = len(rows) + 1
        rows.append(row)

    def flush(self):
        return None


def _company(company_id, company_name, mine_name, active=True):
    return SimpleNamespace(
        id=company_id,
        company_name=company_name,
        mine_name=mine_name,
        is_active=active,
    )


def _user(user_id, email, company, password=VALID_PASSWORD, active=True):
    return SimpleNamespace(
        id=user_id,
        company_id=company.id,
        company=company,
        full_name=f"User {user_id}",
        email=email,
        hashed_password=hash_password(password),
        role="General Manager",
        is_active=active,
    )


class AchitIkhtAuthenticationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.achit_auth = _company(
            2,
            "Achit-Ikht LLC",
            "Achit-Ikht Copper Cathode Operation",
        )
        cls.oyu_auth = _company(1, "Oyu Tolgoi LLC", "Oyu Tolgoi Surface")
        cls.achit_user = _user(20, "demo@achit-ikht.mn", cls.achit_auth)
        cls.oyu_user = _user(10, "admin@minemanager.ai", cls.oyu_auth)
        cls.inactive_user = _user(
            21,
            "inactive@achit-ikht.mn",
            cls.achit_auth,
            active=False,
        )
        cls.db = _Db(
            {
                User: [cls.achit_user, cls.oyu_user, cls.inactive_user],
                Company: [cls.achit_auth, cls.oyu_auth],
                CompanySettings: [
                    SimpleNamespace(
                        id=2,
                        company_name="Achit-Ikht LLC",
                        company_name_en="Achit-Ikht LLC",
                        company_name_mn="Ачит-Ихт ХХК",
                    ),
                    SimpleNamespace(
                        id=1,
                        company_name="Oyu Tolgoi LLC",
                        company_name_en="Oyu Tolgoi LLC",
                        company_name_mn=None,
                    ),
                ],
                MineSettings: [
                    SimpleNamespace(
                        id=2,
                        company_id=2,
                        mine_name="Achit-Ikht Copper Cathode Operation",
                        mine_name_en="Achit-Ikht Copper Cathode Operation",
                        mine_name_mn="Ачит-Ихт Зэсийн Катодын Үйлдвэр",
                        mine_type="Processing Plant / SX-EW",
                    ),
                    SimpleNamespace(
                        id=1,
                        company_id=1,
                        mine_name="Oyu Tolgoi Surface",
                        mine_name_en="Oyu Tolgoi Surface",
                        mine_name_mn=None,
                        mine_type="Open Pit",
                    ),
                ],
            }
        )

    def test_fresh_demo_seed_creates_hashed_achit_user(self):
        db = _Db({Company: [], User: []})

        auth_company, demo_user = seed_authentication(db)

        self.assertEqual(auth_company.company_name, "Achit-Ikht LLC")
        self.assertEqual(demo_user.email, DEMO_USER_EMAIL)
        self.assertEqual(demo_user.company_id, auth_company.id)
        self.assertTrue(demo_user.is_active)
        self.assertNotEqual(demo_user.hashed_password, VALID_PASSWORD)
        self.assertTrue(verify_password(VALID_PASSWORD, demo_user.hashed_password))

    def test_achit_seed_is_idempotent_in_isolated_context(self):
        db = _Db(
            {
                Company: [],
                User: [],
                CompanySettings: [],
                MineSettings: [],
            }
        )

        first_company = get_or_create_company(db)
        first_mine = get_or_create_mine(db, first_company)
        first_auth_company, first_user = seed_authentication(db)

        second_company = get_or_create_company(db)
        second_mine = get_or_create_mine(db, second_company)
        second_auth_company, second_user = seed_authentication(db)

        self.assertEqual(len(db.rows_by_model[Company]), 1)
        self.assertEqual(len(db.rows_by_model[User]), 1)
        self.assertEqual(len(db.rows_by_model[CompanySettings]), 1)
        self.assertEqual(len(db.rows_by_model[MineSettings]), 1)
        self.assertEqual(first_company.id, second_company.id)
        self.assertEqual(first_mine.id, second_mine.id)
        self.assertEqual(first_auth_company.id, second_auth_company.id)
        self.assertEqual(first_user.id, second_user.id)

    def test_valid_achit_credentials_authenticate_and_resolve_tenant(self):
        response = login_user(
            SimpleNamespace(username="demo@achit-ikht.mn", password=VALID_PASSWORD),
            self.db,
        )
        tenant = resolve_authenticated_tenant(self.db, self.achit_user)

        self.assertEqual(response["email"], "demo@achit-ikht.mn")
        self.assertEqual(response["company_id"], 2)
        self.assertEqual(tenant["auth_company_id"], 2)
        self.assertEqual(tenant["company_name"], "Achit-Ikht LLC")
        self.assertEqual(tenant["company_id"], 2)
        self.assertEqual(tenant["mine_id"], 2)

    def test_wrong_password_and_inactive_user_are_rejected(self):
        with self.assertRaises(HTTPException) as wrong:
            login_user(
                SimpleNamespace(
                    username="demo@achit-ikht.mn",
                    password="wrong-password",
                ),
                self.db,
            )
        self.assertEqual(wrong.exception.status_code, 401)

        with self.assertRaises(HTTPException) as inactive:
            login_user(
                SimpleNamespace(
                    username="inactive@achit-ikht.mn",
                    password=VALID_PASSWORD,
                ),
                self.db,
            )
        self.assertEqual(inactive.exception.status_code, 403)

    def test_oyu_authentication_still_works_and_tenants_remain_isolated(self):
        response = login_user(
            SimpleNamespace(username="admin@minemanager.ai", password=VALID_PASSWORD),
            self.db,
        )
        oyu_tenant = resolve_authenticated_tenant(self.db, self.oyu_user)
        achit_tenant = resolve_authenticated_tenant(self.db, self.achit_user)

        self.assertEqual(response["company_id"], 1)
        self.assertEqual(oyu_tenant["company_id"], 1)
        self.assertEqual(oyu_tenant["mine_id"], 1)
        self.assertNotEqual(oyu_tenant["company_id"], achit_tenant["company_id"])
        self.assertNotEqual(oyu_tenant["mine_id"], achit_tenant["mine_id"])


if __name__ == "__main__":
    unittest.main()
