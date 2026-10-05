from __future__ import annotations

import unittest
from datetime import datetime, timezone
from unittest.mock import Mock, patch

import httpx

from app.models.public_lead import PublicLead
from app.services.public_lead_notification_service import (
    GRAPH_SCOPE,
    LeadNotificationSettings,
    build_public_lead_message,
    notify_new_public_lead,
)


def settings(**overrides):
    values = {
        "enabled": True,
        "recipient": "bayarbat.b@minemanager.ai",
        "tenant_id": "test-tenant-id",
        "client_id": "test-client-id",
        "client_secret": "test-client-secret",
        "sender": "sender@example.test",
        "timeout_seconds": 8.0,
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


class FakeResponse:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("POST", "https://provider.example.test")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError(
                "Provider request failed.",
                request=request,
                response=response,
            )

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def client_factory(client):
    factory = Mock(return_value=client)
    return factory


class PublicLeadNotificationTests(unittest.TestCase):
    def test_graph_delivery_uses_oauth_sender_recipient_and_approved_message(self):
        client = FakeClient(
            [
                FakeResponse(200, {"access_token": "test-access-token"}),
                FakeResponse(202),
            ]
        )
        factory = client_factory(client)

        with self.assertLogs(
            "app.services.public_lead_notification_service", level="INFO"
        ) as logs:
            result = notify_new_public_lead(
                lead(), settings=settings(), client_factory=factory
            )

        self.assertTrue(result)
        factory.assert_called_once_with(timeout=8.0)
        self.assertEqual(len(client.calls), 2)

        token_url, token_request = client.calls[0]
        self.assertEqual(
            token_url,
            "https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/token",
        )
        self.assertEqual(token_request["data"]["client_id"], "test-client-id")
        self.assertEqual(token_request["data"]["client_secret"], "test-client-secret")
        self.assertEqual(token_request["data"]["scope"], GRAPH_SCOPE)
        self.assertEqual(token_request["data"]["grant_type"], "client_credentials")

        send_url, send_request = client.calls[1]
        self.assertEqual(
            send_url,
            "https://graph.microsoft.com/v1.0/users/sender%40example.test/sendMail",
        )
        self.assertEqual(
            send_request["headers"]["Authorization"], "Bearer test-access-token"
        )
        payload = send_request["json"]
        self.assertEqual(
            payload["message"]["subject"],
            "[Mine Manager AI] New Demo Lead — Example Mining",
        )
        self.assertEqual(
            payload["message"]["toRecipients"][0]["emailAddress"]["address"],
            "bayarbat.b@minemanager.ai",
        )
        self.assertEqual(payload["message"]["body"]["contentType"], "Text")
        self.assertTrue(payload["saveToSentItems"])
        for expected in (
            "Lead ID:\n42",
            "Company:\nExample Mining",
            "Name:\nBat Erdene",
            "Email / Phone:\n+976 9910 5308",
            "Submitted:\n2026-10-05T03:00:00+00:00",
            "Mine Manager AI Website V2",
        ):
            self.assertIn(expected, payload["message"]["body"]["content"])

        combined_logs = " ".join(logs.output)
        self.assertIn("lead_id=42", combined_logs)
        self.assertNotIn("test-client-secret", combined_logs)
        self.assertNotIn("test-access-token", combined_logs)
        self.assertNotIn("+976 9910 5308", combined_logs)
        self.assertNotIn("Improve management reporting", combined_logs)

    def test_contact_subject_uses_contact_intent(self):
        message = build_public_lead_message(lead(intent="contact"), settings())
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

    def test_environment_configuration_uses_graph_variables(self):
        environment = {
            "LEAD_NOTIFICATION_ENABLED": "true",
            "LEAD_NOTIFICATION_TO": "bayarbat.b@minemanager.ai",
            "MS_GRAPH_TENANT_ID": "tenant",
            "MS_GRAPH_CLIENT_ID": "client",
            "MS_GRAPH_CLIENT_SECRET": "secret",
            "MS_GRAPH_SENDER": "sender@example.test",
            "MS_GRAPH_TIMEOUT_SECONDS": "6",
        }
        with patch.dict("os.environ", environment, clear=True):
            configured = LeadNotificationSettings.from_environment()

        self.assertTrue(configured.enabled)
        self.assertEqual(configured.recipient, "bayarbat.b@minemanager.ai")
        self.assertEqual(configured.tenant_id, "tenant")
        self.assertEqual(configured.client_id, "client")
        self.assertEqual(configured.client_secret, "secret")
        self.assertEqual(configured.sender, "sender@example.test")
        self.assertEqual(configured.timeout_seconds, 6.0)

    def test_default_environment_is_disabled_with_internal_recipient(self):
        with patch.dict("os.environ", {}, clear=True):
            configured = LeadNotificationSettings.from_environment()
        self.assertFalse(configured.enabled)
        self.assertEqual(configured.recipient, "bayarbat.b@minemanager.ai")
        self.assertEqual(configured.timeout_seconds, 8.0)

    def test_disabled_notification_never_opens_network_connection(self):
        factory = Mock()
        result = notify_new_public_lead(
            lead(), settings=settings(enabled=False), client_factory=factory
        )
        self.assertFalse(result)
        factory.assert_not_called()

    def test_incomplete_configuration_never_opens_network_connection(self):
        factory = Mock()
        with self.assertRaisesRegex(RuntimeError, "configuration is incomplete"):
            notify_new_public_lead(
                lead(), settings=settings(client_secret=""), client_factory=factory
            )
        factory.assert_not_called()

    def test_token_failure_stops_before_sendmail(self):
        client = FakeClient([FakeResponse(401)])
        with self.assertRaises(httpx.HTTPStatusError):
            notify_new_public_lead(
                lead(), settings=settings(), client_factory=client_factory(client)
            )
        self.assertEqual(len(client.calls), 1)

    def test_invalid_token_response_stops_before_sendmail(self):
        for payload in ({}, [], ValueError("invalid json")):
            with self.subTest(payload=payload):
                client = FakeClient([FakeResponse(200, payload)])
                with self.assertRaisesRegex(RuntimeError, "token response"):
                    notify_new_public_lead(
                        lead(), settings=settings(), client_factory=client_factory(client)
                    )
                self.assertEqual(len(client.calls), 1)

    def test_graph_provider_errors_are_rejected(self):
        for status_code in (400, 401, 403, 404, 429, 500, 503):
            with self.subTest(status_code=status_code):
                client = FakeClient(
                    [
                        FakeResponse(200, {"access_token": "token"}),
                        FakeResponse(status_code),
                    ]
                )
                with self.assertRaisesRegex(RuntimeError, "sendMail request failed"):
                    notify_new_public_lead(
                        lead(), settings=settings(), client_factory=client_factory(client)
                    )

    def test_network_timeout_is_bounded_and_propagates_to_router_boundary(self):
        timeout = httpx.ReadTimeout("provider timeout")
        client = FakeClient([timeout])
        with self.assertRaises(httpx.ReadTimeout):
            notify_new_public_lead(
                lead(), settings=settings(), client_factory=client_factory(client)
            )

    def test_only_202_is_sendmail_success(self):
        client = FakeClient(
            [FakeResponse(200, {"access_token": "token"}), FakeResponse(200)]
        )
        with self.assertRaisesRegex(RuntimeError, "sendMail request failed"):
            notify_new_public_lead(
                lead(), settings=settings(), client_factory=client_factory(client)
            )

    def test_subject_removes_header_newlines(self):
        message = build_public_lead_message(
            lead(company="Example\r\nBcc: attacker@example.test"), settings()
        )
        self.assertNotIn("\n", message["Subject"])
        self.assertIn("Example Bcc: attacker@example.test", message["Subject"])


if __name__ == "__main__":
    unittest.main()
