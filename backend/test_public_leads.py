from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.models.public_lead import PublicLead
from app.routers import public_leads


VALID_PAYLOAD = {
    "name": "Bat Erdene",
    "company": "Example Mining",
    "role": "General Manager",
    "email_or_phone": "+976 9910 5308",
    "operation_type": "Open-pit copper",
    "improvement_request": "Improve management reporting.",
    "intent": "demo",
    "language": "EN",
    "website": "",
}


class PublicLeadEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        @event.listens_for(cls.engine, "connect")
        def attach_public_schema(dbapi_connection, _connection_record):
            dbapi_connection.execute("ATTACH DATABASE ':memory:' AS public")

        PublicLead.__table__.create(cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)

        app = FastAPI()
        app.include_router(public_leads.router)

        def override_get_db():
            db = cls.Session()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        cls.engine.dispose()

    def setUp(self):
        public_leads._reset_lead_rate_limiter_for_tests()
        with self.Session() as db:
            db.query(PublicLead).delete()
            db.commit()

    def stored_leads(self):
        with self.Session() as db:
            return db.query(PublicLead).order_by(PublicLead.id).all()

    def test_valid_unauthenticated_lead_is_persisted(self):
        response = self.client.post("/api/public/leads", json=VALID_PAYLOAD)

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["success"])
        self.assertIsInstance(response.json()["lead_id"], int)
        leads = self.stored_leads()
        self.assertEqual(len(leads), 1)
        self.assertEqual(leads[0].name, "Bat Erdene")
        self.assertEqual(leads[0].intent, "demo")
        self.assertEqual(leads[0].language, "EN")
        self.assertIsNotNone(leads[0].created_at)

    def test_blank_required_field_is_rejected(self):
        response = self.client.post(
            "/api/public/leads",
            json={**VALID_PAYLOAD, "name": "   "},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.stored_leads(), [])

    def test_oversized_value_is_rejected(self):
        response = self.client.post(
            "/api/public/leads",
            json={**VALID_PAYLOAD, "improvement_request": "x" * 2001},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.stored_leads(), [])

    def test_invalid_email_or_phone_is_rejected(self):
        response = self.client.post(
            "/api/public/leads",
            json={**VALID_PAYLOAD, "email_or_phone": "not-contact"},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.stored_leads(), [])

    def test_unknown_intent_normalizes_to_contact(self):
        response = self.client.post(
            "/api/public/leads",
            json={**VALID_PAYLOAD, "intent": "anything-at-all"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.stored_leads()[0].intent, "contact")

    def test_missing_or_invalid_language_defaults_to_mn(self):
        payload = {**VALID_PAYLOAD, "language": "invalid"}
        response = self.client.post("/api/public/leads", json=payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.stored_leads()[0].language, "MN")

    def test_honeypot_does_not_create_lead(self):
        response = self.client.post(
            "/api/public/leads",
            json={**VALID_PAYLOAD, "website": "spam.example"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"success": True, "message": "Lead received"})
        self.assertEqual(self.stored_leads(), [])

    def test_rate_limit_is_deterministic_and_per_client(self):
        for index in range(public_leads.RATE_LIMIT_ATTEMPTS):
            response = self.client.post(
                "/api/public/leads",
                json={**VALID_PAYLOAD, "name": f"Lead {index}"},
            )
            self.assertEqual(response.status_code, 201)

        response = self.client.post("/api/public/leads", json=VALID_PAYLOAD)
        self.assertEqual(response.status_code, 429)

    def test_database_failure_returns_safe_error(self):
        class FailingSession:
            def add(self, _lead):
                pass

            def commit(self):
                raise SQLAlchemyError("database internals")

            def rollback(self):
                pass

        original_override = self.client.app.dependency_overrides[get_db]
        try:
            self.client.app.dependency_overrides[get_db] = lambda: FailingSession()
            with self.assertLogs("app.routers.public_leads", level="ERROR"):
                response = self.client.post("/api/public/leads", json=VALID_PAYLOAD)
        finally:
            self.client.app.dependency_overrides[get_db] = original_override

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": "Unable to process request."})
        self.assertNotIn("database internals", response.text)


class PublicLeadMigrationTests(unittest.TestCase):
    def test_migration_has_expected_revision_and_reversible_table(self):
        path = Path("alembic/versions/b7d2e4f6a8c1_create_public_leads.py")
        spec = importlib.util.spec_from_file_location("public_lead_migration", path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)

        self.assertEqual(migration.revision, "b7d2e4f6a8c1")
        self.assertEqual(migration.down_revision, "e28c4d70a9bf")


if __name__ == "__main__":
    unittest.main()
