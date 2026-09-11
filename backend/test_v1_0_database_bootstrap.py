from __future__ import annotations

import os
import unittest
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.scripts.bootstrap_v1_0_database import (
    BootstrapRefused,
    SCHEMA_ARTIFACT,
    assert_empty_database,
    assert_safe_target,
    bootstrap_database,
)
from app.scripts.v1_0_schema_contract import (
    CONTRACT_REVISION,
    TABLE_COLUMNS,
    verify_schema_contract,
)


class BootstrapContractUnitTests(unittest.TestCase):
    def test_contract_targets_c4_and_includes_all_required_tables(self):
        self.assertEqual(CONTRACT_REVISION, "c4e91a7b2d30")
        self.assertEqual(
            set(TABLE_COLUMNS),
            {
                "companies",
                "users",
                "company_settings",
                "mine_settings",
                "kpi_targets",
                "alert_thresholds",
                "shift_patterns",
                "production_daily",
                "fleet_daily",
                "plant_daily",
                "safety_daily",
                "upload_logs",
                "report_history",
                "executive_actions",
                "audit_logs",
            },
        )
        executive_columns = TABLE_COLUMNS["executive_actions"]
        self.assertEqual(
            executive_columns["source"],
            ("character varying(50)", True, None),
        )
        self.assertEqual(
            executive_columns["category"],
            ("character varying(100)", True, None),
        )

    def test_schema_artifact_is_schema_only_and_customer_neutral(self):
        sql = Path(SCHEMA_ARTIFACT).read_text(encoding="utf-8").lower()
        self.assertNotIn("insert into", sql)
        self.assertNotIn("oyu tolgoi", sql)
        self.assertNotIn("achit-ikht", sql)
        self.assertNotIn("bayarbat", sql)
        self.assertNotIn("replace-with-secure-password", sql)

    def test_azure_host_is_refused(self):
        with self.assertRaises(BootstrapRefused):
            assert_safe_target(
                database_url=(
                    "postgresql://user:password@mine.postgres.database.azure.com/db"
                ),
                confirmed_database_name="db",
            )

    def test_database_name_mismatch_is_refused(self):
        with self.assertRaises(BootstrapRefused):
            assert_safe_target(
                database_url="postgresql://user:password@127.0.0.1/actual",
                confirmed_database_name="different",
            )


@unittest.skipUnless(
    os.getenv("MINE_MANAGER_BOOTSTRAP_TEST_URL"),
    "Set MINE_MANAGER_BOOTSTRAP_TEST_URL to a dedicated disposable PostgreSQL DB",
)
class BootstrapPostgresIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database_url = os.environ["MINE_MANAGER_BOOTSTRAP_TEST_URL"]
        cls.database_name = make_url(cls.database_url).database or ""
        disposable_dev_allowed = (
            cls.database_name == "mine_manager_ai_dev"
            and os.getenv("MINE_MANAGER_BOOTSTRAP_ALLOW_DISPOSABLE_DEV") == "1"
        )
        if not (
            cls.database_name.startswith("mine_manager_ai_bootstrap_test_")
            or disposable_dev_allowed
        ):
            raise RuntimeError(
                "Integration test database name must start with "
                "mine_manager_ai_bootstrap_test_, unless the dedicated "
                "mine_manager_ai_dev database is explicitly opted in"
            )
        cls.engine = create_engine(
            cls.database_url,
            connect_args={"sslmode": os.getenv("DB_SSLMODE", "require")},
        )

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        with self.engine.begin() as connection:
            connection.exec_driver_sql("DROP SCHEMA IF EXISTS public CASCADE")
            connection.exec_driver_sql("CREATE SCHEMA public")

    def test_a_empty_database_bootstraps_and_stamps(self):
        result = bootstrap_database(
            database_url=self.database_url,
            confirmed_database_name=self.database_name,
        )
        self.assertEqual(result["status"], "ready")
        with self.engine.connect() as connection:
            self.assertEqual(
                connection.execute(
                    text("SELECT version_num FROM public.alembic_version")
                ).scalar_one(),
                CONTRACT_REVISION,
            )
            self.assertEqual(
                verify_schema_contract(
                    connection,
                    allow_alembic_version=True,
                ),
                [],
            )

    def test_b_application_table_is_refused(self):
        with self.engine.begin() as connection:
            connection.exec_driver_sql(
                "CREATE TABLE public.companies (id integer PRIMARY KEY)"
            )
        with self.engine.connect() as connection:
            with self.assertRaises(BootstrapRefused):
                assert_empty_database(connection)

    def test_c_alembic_revision_is_refused(self):
        with self.engine.begin() as connection:
            connection.exec_driver_sql(
                "CREATE TABLE public.alembic_version "
                "(version_num character varying(32) NOT NULL)"
            )
            connection.execute(
                text(
                    "INSERT INTO public.alembic_version (version_num) "
                    "VALUES ('4660dbe88875')"
                )
            )
        with self.engine.connect() as connection:
            with self.assertRaisesRegex(BootstrapRefused, "Alembic revision"):
                assert_empty_database(connection)

    def test_d_partial_schema_is_refused(self):
        with self.engine.begin() as connection:
            connection.exec_driver_sql(
                "CREATE SEQUENCE public.production_daily_id_seq"
            )
        with self.engine.connect() as connection:
            with self.assertRaises(BootstrapRefused):
                assert_empty_database(connection)

    def test_e_already_bootstrapped_database_is_refused(self):
        bootstrap_database(
            database_url=self.database_url,
            confirmed_database_name=self.database_name,
        )
        with self.engine.connect() as connection:
            with self.assertRaises(BootstrapRefused):
                assert_empty_database(connection)

    def test_f_core_table_and_executive_action_smoke(self):
        bootstrap_database(
            database_url=self.database_url,
            confirmed_database_name=self.database_name,
        )
        with self.engine.connect() as connection:
            transaction = connection.begin()
            try:
                auth_company_id = connection.execute(
                    text(
                        "INSERT INTO public.companies "
                        "(company_name, mine_name) "
                        "VALUES ('Bootstrap Test Company', 'Bootstrap Test Mine') "
                        "RETURNING id"
                    )
                ).scalar_one()
                user_id = connection.execute(
                    text(
                        "INSERT INTO public.users "
                        "(company_id, full_name, email, hashed_password) "
                        "VALUES (:company_id, 'Bootstrap Admin', "
                        "'bootstrap@example.invalid', 'not-a-real-credential') "
                        "RETURNING id"
                    ),
                    {"company_id": auth_company_id},
                ).scalar_one()
                company_id = connection.execute(
                    text(
                        "INSERT INTO public.company_settings (company_name) "
                        "VALUES ('Bootstrap Test Company') RETURNING id"
                    )
                ).scalar_one()
                mine_id = connection.execute(
                    text(
                        "INSERT INTO public.mine_settings (company_id, mine_name) "
                        "VALUES (:company_id, 'Bootstrap Test Mine') RETURNING id"
                    ),
                    {"company_id": company_id},
                ).scalar_one()
                second_company_id = connection.execute(
                    text(
                        "INSERT INTO public.company_settings (company_name) "
                        "VALUES ('Second Test Company') RETURNING id"
                    )
                ).scalar_one()
                second_mine_id = connection.execute(
                    text(
                        "INSERT INTO public.mine_settings (company_id, mine_name) "
                        "VALUES (:company_id, 'Second Test Mine') RETURNING id"
                    ),
                    {"company_id": second_company_id},
                ).scalar_one()

                statements = [
                    (
                        "INSERT INTO public.kpi_targets (mine_id, kpi_name) "
                        "VALUES (:mine_id, 'Production')",
                        {"mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.alert_thresholds (mine_id, alert_name) "
                        "VALUES (:mine_id, 'Production Watch')",
                        {"mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.shift_patterns "
                        "(mine_id, shift_name, start_time, end_time) "
                        "VALUES (:mine_id, 'Day', '08:00', '20:00')",
                        {"mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.production_daily "
                        "(company_id, mine_id, mine_name, report_date, ore_actual) "
                        "VALUES (:company_id, :mine_id, 'Bootstrap Test Mine', "
                        "DATE '2026-09-11', 1)",
                        {"company_id": company_id, "mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.fleet_daily "
                        "(company_id, mine_id, mine_name, report_date, availability) "
                        "VALUES (:company_id, :mine_id, 'Bootstrap Test Mine', "
                        "DATE '2026-09-11', 99)",
                        {"company_id": company_id, "mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.plant_daily "
                        "(company_id, mine_id, mine_name, report_date, recovery) "
                        "VALUES (:company_id, :mine_id, 'Bootstrap Test Mine', "
                        "DATE '2026-09-11', 95)",
                        {"company_id": company_id, "mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.safety_daily "
                        "(company_id, mine_id, mine_name, report_date) "
                        "VALUES (:company_id, :mine_id, 'Bootstrap Test Mine', "
                        "DATE '2026-09-11')",
                        {"company_id": company_id, "mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.upload_logs "
                        "(company_id, mine_id, report_type, file_name, uploaded_by) "
                        "VALUES (:company_id, :mine_id, 'Production', "
                        "'test.xlsx', 'Bootstrap Admin')",
                        {"company_id": company_id, "mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.report_history "
                        "(company_id, mine_id, report_key, report_name, "
                        "report_format, filename) VALUES (:company_id, :mine_id, "
                        "'daily', 'Daily', 'PDF', 'daily.pdf')",
                        {"company_id": company_id, "mine_id": mine_id},
                    ),
                    (
                        "INSERT INTO public.audit_logs "
                        "(company_id, actor_user_id, action, entity_type) "
                        "VALUES (:company_id, :user_id, 'CREATE', 'bootstrap')",
                        {"company_id": auth_company_id, "user_id": user_id},
                    ),
                ]
                for statement, parameters in statements:
                    connection.execute(text(statement), parameters)

                manual = connection.execute(
                    text(
                        "INSERT INTO public.executive_actions "
                        "(company_id, mine_id, action_key, kpi_key, title, "
                        "source, category) VALUES (:company_id, :mine_id, "
                        "'shared-key', 'production', 'Manual action', "
                        "'manual', 'Production') RETURNING source, category, kpi_key"
                    ),
                    {"company_id": company_id, "mine_id": mine_id},
                ).one()
                connection.execute(
                    text(
                        "INSERT INTO public.executive_actions "
                        "(company_id, mine_id, action_key, kpi_key, title) "
                        "VALUES (:company_id, :mine_id, 'shared-key', "
                        "'production', 'Legacy AI action')"
                    ),
                    {"company_id": second_company_id, "mine_id": second_mine_id},
                )
                self.assertEqual(tuple(manual), ("manual", "Production", "production"))
            finally:
                transaction.rollback()


if __name__ == "__main__":
    unittest.main()
