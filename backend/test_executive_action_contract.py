from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.executive_action import ExecutiveAction
from app.routers import executive_actions
from app.schemas.executive_action import (
    ExecutiveActionCreate,
    ExecutiveActionResponse,
    ExecutiveActionUpdate,
)
from app.services.executive_action_service import (
    create_action,
    get_action_by_id,
    list_actions,
    update_action,
)


class ExecutiveActionContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        for table_name in (
            "company_settings",
            "mine_settings",
            "executive_actions",
        ):
            Base.metadata.tables[table_name].create(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        with self.Session() as db:
            db.query(ExecutiveAction).delete()
            db.commit()

    def test_manual_source_and_category_persist_and_serialize(self):
        with self.Session() as db:
            created = create_action(
                db=db,
                action_data=ExecutiveActionCreate(
                    action_key="production_manual_2026-09-11_test",
                    kpi_key="production",
                    title="Review production constraint",
                    owner="Production Superintendent",
                    priority="high",
                    status="open",
                    source="manual",
                    category="Production",
                ),
                company_id=1,
                mine_id=10,
            )

            read_back = get_action_by_id(
                db=db,
                action_id=created.id,
                company_id=1,
                mine_id=10,
            )

            self.assertIsNotNone(read_back)
            self.assertEqual(read_back.source, "manual")
            self.assertEqual(read_back.category, "Production")

            response = ExecutiveActionResponse.model_validate(read_back)
            self.assertEqual(response.source, "manual")
            self.assertEqual(response.category, "Production")

    def test_create_without_optional_fields_remains_compatible(self):
        with self.Session() as db:
            created = create_action(
                db=db,
                action_data=ExecutiveActionCreate(
                    action_key="legacy_ai_action_test",
                    kpi_key="fleet",
                    title="Maintain fleet availability",
                ),
                company_id=1,
                mine_id=10,
            )

            self.assertIsNone(created.source)
            self.assertIsNone(created.category)
            response = ExecutiveActionResponse.model_validate(created)
            self.assertIsNone(response.source)
            self.assertIsNone(response.category)

    def test_update_preserves_source_and_category(self):
        with self.Session() as db:
            created = create_action(
                db=db,
                action_data=ExecutiveActionCreate(
                    action_key="plant_manual_2026-09-11_test",
                    kpi_key="plant",
                    title="Review plant constraint",
                    source="manual",
                    category="Plant",
                ),
                company_id=1,
                mine_id=10,
            )

            updated = update_action(
                db=db,
                action=created,
                action_data=ExecutiveActionUpdate(
                    title="Review updated plant constraint",
                    source="manual",
                    category="Safety",
                ),
            )

            self.assertEqual(updated.source, "manual")
            self.assertEqual(updated.category, "Plant")
            self.assertEqual(updated.title, "Review updated plant constraint")
            self.assertEqual(updated.kpi_key, "plant")
            self.assertNotIn(
                "source",
                ExecutiveActionUpdate.model_fields,
            )
            self.assertNotIn(
                "category",
                ExecutiveActionUpdate.model_fields,
            )

    def test_list_actions_remains_scoped_by_company_and_mine(self):
        with self.Session() as db:
            for company_id, mine_id, action_key in (
                (1, 10, "safety_manual_tenant_one"),
                (1, 11, "safety_manual_other_mine"),
                (2, 20, "safety_manual_other_company"),
            ):
                create_action(
                    db=db,
                    action_data=ExecutiveActionCreate(
                        action_key=action_key,
                        kpi_key="safety",
                        title=action_key,
                        source="manual",
                        category="Safety",
                    ),
                    company_id=company_id,
                    mine_id=mine_id,
                )

            tenant_actions = list_actions(
                db=db,
                company_id=1,
                mine_id=10,
            )

            self.assertEqual(
                [action.action_key for action in tenant_actions],
                ["safety_manual_tenant_one"],
            )

    def test_router_create_then_get_returns_persisted_fields(self):
        tenant = {
            "company_id": 1,
            "mine_id": 10,
        }
        user = SimpleNamespace(id=7)

        with self.Session() as db, patch.object(
            executive_actions,
            "_resolve_tenant",
            return_value=tenant,
        ):
            created = executive_actions.create_executive_action(
                action_data=ExecutiveActionCreate(
                    action_key="fleet_manual_router_round_trip",
                    kpi_key="fleet",
                    title="Review fleet performance",
                    source="manual",
                    category="Fleet",
                ),
                db=db,
                current_user=user,
            )
            read_back = executive_actions.get_executive_action(
                action_id=created.id,
                db=db,
                current_user=user,
            )

            response = ExecutiveActionResponse.model_validate(read_back)
            self.assertEqual(response.source, "manual")
            self.assertEqual(response.category, "Fleet")

    def test_duplicate_action_key_remains_tenant_scoped(self):
        user = SimpleNamespace(id=7)
        payload = ExecutiveActionCreate(
            action_key="ai_duplicate_contract_test",
            kpi_key="production",
            title="Review production performance",
        )

        with self.Session() as db:
            with patch.object(
                executive_actions,
                "_resolve_tenant",
                return_value={"company_id": 1, "mine_id": 10},
            ):
                executive_actions.create_executive_action(
                    action_data=payload,
                    db=db,
                    current_user=user,
                )
                with self.assertRaises(HTTPException) as duplicate_error:
                    executive_actions.create_executive_action(
                        action_data=payload,
                        db=db,
                        current_user=user,
                    )
                self.assertEqual(duplicate_error.exception.status_code, 409)

            with patch.object(
                executive_actions,
                "_resolve_tenant",
                return_value={"company_id": 2, "mine_id": 20},
            ):
                other_tenant = executive_actions.create_executive_action(
                    action_data=payload,
                    db=db,
                    current_user=user,
                )

            self.assertEqual(other_tenant.action_key, payload.action_key)


class ExecutiveActionMigrationTests(unittest.TestCase):
    @staticmethod
    def _load_migration_module():
        path = Path(
            "alembic/versions/"
            "c4e91a7b2d30_add_source_category_to_executive_actions.py"
        )
        spec = importlib.util.spec_from_file_location(
            "executive_action_source_category_migration",
            path,
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_migration_revision_and_upgrade_columns(self):
        migration = self._load_migration_module()
        added_columns = []

        with patch.object(
            migration.op,
            "add_column",
            side_effect=lambda table, column, **kwargs: added_columns.append(
                (table, column.name, column.type.length, column.nullable, kwargs)
            ),
        ):
            migration.upgrade()

        self.assertEqual(migration.revision, "c4e91a7b2d30")
        self.assertEqual(migration.down_revision, "7b9f4c2a1d6e")
        self.assertEqual(
            added_columns,
            [
                ("executive_actions", "source", 50, True, {"schema": "public"}),
                ("executive_actions", "category", 100, True, {"schema": "public"}),
            ],
        )

    def test_migration_downgrade_removes_columns_in_reverse_order(self):
        migration = self._load_migration_module()
        dropped_columns = []

        with patch.object(
            migration.op,
            "drop_column",
            side_effect=lambda table, column, **kwargs: dropped_columns.append(
                (table, column, kwargs)
            ),
        ):
            migration.downgrade()

        self.assertEqual(
            dropped_columns,
            [
                ("executive_actions", "category", {"schema": "public"}),
                ("executive_actions", "source", {"schema": "public"}),
            ],
        )


if __name__ == "__main__":
    unittest.main()
