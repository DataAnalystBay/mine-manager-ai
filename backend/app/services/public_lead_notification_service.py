from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import timezone
from email.message import EmailMessage
from typing import Callable
from urllib.parse import quote

import httpx

from app.models.public_lead import PublicLead


logger = logging.getLogger(__name__)

DEFAULT_RECIPIENT = "bayarbat.b@minemanager.ai"
DEFAULT_TIMEOUT_SECONDS = 8.0
GRAPH_SCOPE = "https://graph.microsoft.com/.default"


def _environment_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class LeadNotificationSettings:
    enabled: bool
    recipient: str
    tenant_id: str
    client_id: str
    client_secret: str
    sender: str
    timeout_seconds: float

    @classmethod
    def from_environment(cls) -> "LeadNotificationSettings":
        return cls(
            enabled=_environment_flag("LEAD_NOTIFICATION_ENABLED"),
            recipient=os.getenv("LEAD_NOTIFICATION_TO", DEFAULT_RECIPIENT).strip(),
            tenant_id=os.getenv("MS_GRAPH_TENANT_ID", "").strip(),
            client_id=os.getenv("MS_GRAPH_CLIENT_ID", "").strip(),
            client_secret=os.getenv("MS_GRAPH_CLIENT_SECRET", ""),
            sender=os.getenv("MS_GRAPH_SENDER", "").strip(),
            timeout_seconds=float(
                os.getenv("MS_GRAPH_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))
            ),
        )

    def validate(self) -> None:
        if not self.enabled:
            return
        if not all(
            (
                self.recipient,
                self.tenant_id,
                self.client_id,
                self.client_secret,
                self.sender,
            )
        ):
            raise RuntimeError("Lead notification configuration is incomplete.")
        if not 1 <= self.timeout_seconds <= 30:
            raise RuntimeError("Graph timeout must be between 1 and 30 seconds.")


def _safe_subject_company(company: str) -> str:
    cleaned = " ".join(company.replace("\r", " ").replace("\n", " ").split())
    return cleaned[:160]


def _submitted_at_utc(lead: PublicLead) -> str:
    created_at = lead.created_at
    if created_at is None:
        return "Not available"
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return created_at.astimezone(timezone.utc).isoformat()


def build_public_lead_message(
    lead: PublicLead,
    settings: LeadNotificationSettings,
) -> EmailMessage:
    intent_label = "Demo" if lead.intent == "demo" else "Contact"
    company = _safe_subject_company(lead.company)
    subject = (
        f"[Mine Manager AI] New {intent_label} Lead — {company}"
        if company
        else "[Mine Manager AI] New Website Lead"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.sender
    message["To"] = settings.recipient
    message.set_content(
        "\n".join(
            [
                "New Mine Manager AI website lead",
                "",
                "Intent:",
                intent_label,
                "",
                "Name:",
                lead.name,
                "",
                "Company:",
                lead.company,
                "",
                "Role:",
                lead.role or "Not provided",
                "",
                "Email / Phone:",
                lead.email_or_phone,
                "",
                "Mine / Operation:",
                lead.operation_type or "Not provided",
                "",
                "What they want to improve:",
                lead.improvement_request or "Not provided",
                "",
                "Language:",
                lead.language,
                "",
                "Lead ID:",
                str(lead.id),
                "",
                "Submitted:",
                _submitted_at_utc(lead),
                "",
                "Source:",
                "Mine Manager AI Website V2",
            ]
        )
    )
    return message


def _acquire_graph_access_token(
    client: httpx.Client,
    settings: LeadNotificationSettings,
) -> str:
    token_url = (
        "https://login.microsoftonline.com/"
        f"{quote(settings.tenant_id, safe='')}/oauth2/v2.0/token"
    )
    response = client.post(
        token_url,
        data={
            "client_id": settings.client_id,
            "client_secret": settings.client_secret,
            "scope": GRAPH_SCOPE,
            "grant_type": "client_credentials",
        },
    )
    response.raise_for_status()
    try:
        token_payload = response.json()
    except (TypeError, ValueError) as exc:
        raise RuntimeError("Graph token response was invalid.") from exc
    if not isinstance(token_payload, dict):
        raise RuntimeError("Graph token response was invalid.")
    access_token = token_payload.get("access_token")
    if not isinstance(access_token, str) or not access_token:
        raise RuntimeError("Graph token response did not include an access token.")
    return access_token


def notify_new_public_lead(
    lead: PublicLead,
    *,
    settings: LeadNotificationSettings | None = None,
    client_factory: Callable[..., httpx.Client] = httpx.Client,
) -> bool:
    resolved_settings = settings or LeadNotificationSettings.from_environment()
    if not resolved_settings.enabled:
        return False

    resolved_settings.validate()
    message = build_public_lead_message(lead, resolved_settings)
    payload = {
        "message": {
            "subject": message["Subject"],
            "body": {
                "contentType": "Text",
                "content": message.get_content(),
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": resolved_settings.recipient,
                    }
                }
            ],
        },
        "saveToSentItems": True,
    }

    with client_factory(timeout=resolved_settings.timeout_seconds) as client:
        access_token = _acquire_graph_access_token(client, resolved_settings)
        send_url = (
            "https://graph.microsoft.com/v1.0/users/"
            f"{quote(resolved_settings.sender, safe='')}/sendMail"
        )
        response = client.post(
            send_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if response.status_code != 202:
            raise RuntimeError("Graph sendMail request failed.")

    logger.info(
        "Public lead notification sent lead_id=%s intent=%s language=%s",
        lead.id,
        lead.intent,
        lead.language,
    )
    return True
