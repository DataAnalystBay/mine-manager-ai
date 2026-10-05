from __future__ import annotations

import unittest
from datetime import datetime, timezone
from unittest.mock import Mock, patch

from app.models.public_lead import PublicLead
from app.services.public_lead_notification_service import (
    LeadNotificationSettings,
    build_public_lead_message,
    notify_new_public_lead,
)


def settings(**overrides):
    values = {
        "enabled": True,
        "recipient": "bayarbat.b@minemanager.ai",
        "smtp_host": "smtp.example.test",
        "smtp_port": 587,
        "smtp_username": "mailer@example.test",
        "smtp_password": "test-only-password",
        "smtp_from": "Mine Manager AI <mailer@example.test>",
        "smtp_use_tls": True,
        "smtp_timeout_seconds": 8.0,
    }
    values.update(overrides)
    return LeadNotificationSettings(**values)


def lead(**overrides):
    values = {
        "id": 42,
        "name": "Bat Erdene",
        "company": "Example Mining",
        "role": "General Manager",
        "email_or_phone": "+976 9910 5308",
        "operation_type": "Open-pit copper",
        "improvement_request": "Improve management reporting.",
        "intent": "demo",
        "language": "MN",
        "created_at": datetime(2026, 10, 5, 3, 0, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return PublicLead(**values)


class FakeSmtp:
    def __init__(self, host, port, timeout):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.starttls = Mock()
        self.login = Mock()
        self.send_message = Mock()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class PublicLeadNotificationTests(unittest.TestCase):
    def test_demo_message_has_recipient_subject_and_required_body(self):
        message = build_public_lead_message(lead(), settings())
        body = message.get_content()

        self.assertEqual(message["To"], "bayarbat.b@minemanager.ai")
        self.assertEqual(
            message["Subject"],
            "[Mine Manager AI] New Demo Lead — Example Mining",
        )
        for expected in (
            "Lead ID:\n42",
            "Company:\nExample Mining",
            "Name:\nBat Erdene",
            "Email / Phone:\n+976 9910 5308",
            "Submitted:\n2026-10-05T03:00:00+00:00",
            "Mine Manager AI Website V2",
        ):
            self.assertIn(expected, body)

    def test_contact_subject_uses_contact_intent(self):
        message = build_public_lead_message(
            lead(intent="contact"),
            settings(),
        )
        self.assertEqual(
            message["Subject"],
            "[Mine Manager AI] New Contact Lead — Example Mining",
        )

    def test_optional_fields_use_safe_fallback_text(self):
        message = build_public_lead_message(
            lead(role=None, operation_type=None, improvement_request=None),
            settings(),
        )
        self.assertEqual(message.get_content().count("Not provided"), 3)

    def test_environment_configuration_uses_expected_recipient(self):
        environment = {
            "LEAD_NOTIFICATION_ENABLED": "true",
            "LEAD_NOTIFICATION_TO": "bayarbat.b@minemanager.ai",
            "SMTP_HOST": "smtp.example.test",
            "SMTP_PORT": "2525",
            "SMTP_USERNAME": "mailer",
            "SMTP_PASSWORD": "test-password",
            "SMTP_FROM": "mailer@example.test",
            "SMTP_USE_TLS": "false",
            "SMTP_TIMEOUT_SECONDS": "6",
        }
        with patch.dict("os.environ", environment, clear=True):
            configured = LeadNotificationSettings.from_environment()

        self.assertTrue(configured.enabled)
        self.assertEqual(configured.recipient, "bayarbat.b@minemanager.ai")
        self.assertEqual(configured.smtp_port, 2525)
        self.assertFalse(configured.smtp_use_tls)
        self.assertEqual(configured.smtp_timeout_seconds, 6.0)

    def test_default_environment_is_disabled_with_internal_recipient(self):
        with patch.dict("os.environ", {}, clear=True):
            configured = LeadNotificationSettings.from_environment()
        self.assertFalse(configured.enabled)
        self.assertEqual(configured.recipient, "bayarbat.b@minemanager.ai")
        self.assertEqual(configured.smtp_timeout_seconds, 8.0)

    def test_disabled_notification_never_opens_network_connection(self):
        smtp_factory = Mock()
        result = notify_new_public_lead(
            lead(),
            settings=settings(enabled=False),
            smtp_factory=smtp_factory,
        )
        self.assertFalse(result)
        smtp_factory.assert_not_called()

    def test_smtp_delivery_uses_tls_login_and_bounded_timeout(self):
        smtp = FakeSmtp("", 0, 0)
        smtp_factory = Mock(return_value=smtp)

        result = notify_new_public_lead(
            lead(),
            settings=settings(),
            smtp_factory=smtp_factory,
        )

        self.assertTrue(result)
        smtp_factory.assert_called_once_with(
            "smtp.example.test",
            587,
            timeout=8.0,
        )
        smtp.starttls.assert_called_once()
        smtp.login.assert_called_once_with(
            "mailer@example.test",
            "test-only-password",
        )
        smtp.send_message.assert_called_once()

    def test_subject_removes_header_newlines(self):
        message = build_public_lead_message(
            lead(company="Example\r\nBcc: attacker@example.test"),
            settings(),
        )
        self.assertNotIn("\n", message["Subject"])
        self.assertIn("Example Bcc: attacker@example.test", message["Subject"])


if __name__ == "__main__":
    unittest.main()
