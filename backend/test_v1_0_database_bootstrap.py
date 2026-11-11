from __future__ import annotations

import io
import os
import re
import unittest
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.scripts.bootstrap_v1_0_database import (
    BACKEND_ROOT,
    BootstrapRefused,
    SCHEMA_ARTIFACT,
    alembic_head,
    assert_empty_database,
    assert_safe_target,
    bootstrap_database,
)
from app.scripts.v1_0_schema_contract import (
    CONTRACT_REVISION,
    INDEXES,
    TABLE_COLUMNS,
    verify_schema_contract,
)


def _objects_added_after_baseline() -> tuple[
    set[str], set[tuple[str, str]], set[str],
]:
    """Render the migrations after the baseline offline; list what they add."""

    buffer = io.StringIO()
    # No ini file: env.py then skips fileConfig, which would disable the
    # loggers other tests assert on.
    config = Config(output_buffer=buffer)
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    command.upgrade(config, f"{CONTRACT_REVISION}:head", sql=True)
    sql = buffer.getvalue()
    tables = set(re.findall(r'CREATE TABLE (?:public\.)?"?(\w+)"?', sql))
    columns = set(
        re.findall(
            r'ALTER TABLE (?:public\.)?"?(\w+)"? ADD COLUMN "?(\w+)"?', sql
        )
    )
    indexes = set(re.findall(r'CREATE (?:UNIQUE )?INDEX "?(\w+)"?', sql))
    return tables, columns, indexes


def _artifact_columns() -> dict[str, set[str]]:
    sql = Path(SCHEMA_ARTIFACT).read_text(encoding="utf-8")
    return {
        table: set(re.findall(r"^ {4}(\w+)\b", body, flags=re.M)) - {"CONSTRAINT"}
        for table, body in re.findall(
            r"^CREATE TABLE public\.(\w+) \((.*?)^\);", sql, flags=re.M | re.S
        )
    }


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

    def test_schema_artifact_columns_match_contract(self):
        self.assertEqual(
            _artifact_columns(),
            {table: set(columns) for table, columns in TABLE_COLUMNS.items()},
        )

    def test_baseline_excludes_objects_added_by_later_migrations(self):
        # The bootstrap stamps CONTRACT_REVISION and then runs every later
        # migration, so the baseline must not already contain what they add.
        tables, columns, indexes = _objects_added_after_baseline()
        self.assertIn(("kpi_targets", "kpi_code"), columns)
        self.assertEqual(tables & set(TABLE_COLUMNS), set())
        self.assertEqual(
            {
                (table, column)
                for table, column in columns
                if column in TABLE_COLUMNS.get(table, {})
            },
            set(),
        )
        contract_indexes = {
            name for table_indexes in INDEXES.values() for name in table_indexes
        }
        self.assertEqual(indexes & contract_indexes, set())

    def test_migration_tree_has_one_head_descending_from_baseline(self):
        head = alembic_head()
        self.assertNotEqual(head, CONTRACT_REVISION)

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

    def test_a_empty_database_bootstraps_and_upgrades_to_head(self):
        head = alembic_head()
        result = bootstrap_database(
            database_url=self.database_url,
            confirmed_database_name=self.database_name,
        )
        self.assertEqual(result["status"], "ready")
        self.assertEqual(result["baseline_revision"], CONTRACT_REVISION)
        self.assertEqual(result["schema_revision"], head)
        later_tables, later_columns, _ = _objects_added_after_baseline()
        with self.engine.connect() as connection:
            self.assertEqual(
                connection.execute(
                    text("SELECT version_num FROM public.alembic_version")
                ).scalar_one(),
                head,
            )
            actual_columns = {
                (row[0], row[1])
                for row in connection.execute(
                    text(
                        "SELECT table_name, column_name "
                        "FROM information_schema.columns "
                        "WHERE table_schema = 'public'"
                    )
                )
            }
        actual_tables = {table for table, _ in actual_columns}
        self.assertLessEqual(set(TABLE_COLUMNS) | later_tables, actual_tables)
        self.assertLessEqual(later_columns, actual_columns)

    def test_g_artifact_matches_contract_and_drift_is_detected(self):
        with self.engine.begin() as connection:
            connection.exec_driver_sql(
                Path(SCHEMA_ARTIFACT).read_text(encoding="utf-8")
            )
            self.assertEqual(verify_schema_contract(connection), [])
            # Folding a later migration's column into the baseline is the
            # drift that once broke fresh installs; the contract must see it.
            connection.exec_driver_sql(
                "ALTER TABLE public.kpi_targets "
                "ADD COLUMN kpi_code character varying(100)"
            )
            differences = verify_schema_contract(connection)
        self.assertTrue(
            any("kpi_targets columns differ" in item for item in differences),
            differences,
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
