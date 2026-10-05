from __future__ import annotations

import logging
import os
import smtplib
import ssl
from dataclasses import dataclass
from datetime import timezone
from email.message import EmailMessage
from typing import Callable

from app.models.public_lead import PublicLead


logger = logging.getLogger(__name__)

DEFAULT_RECIPIENT = "bayarbat.b@minemanager.ai"
DEFAULT_TIMEOUT_SECONDS = 8.0


def _environment_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class LeadNotificationSettings:
    enabled: bool
    recipient: str
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_from: str
    smtp_use_tls: bool
    smtp_timeout_seconds: float

    @classmethod
    def from_environment(cls) -> "LeadNotificationSettings":
        return cls(
            enabled=_environment_flag("LEAD_NOTIFICATION_ENABLED"),
            recipient=os.getenv("LEAD_NOTIFICATION_TO", DEFAULT_RECIPIENT).strip(),
            smtp_host=os.getenv("SMTP_HOST", "").strip(),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_username=os.getenv("SMTP_USERNAME", "").strip(),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            smtp_from=os.getenv("SMTP_FROM", "").strip(),
            smtp_use_tls=_environment_flag("SMTP_USE_TLS", default=True),
            smtp_timeout_seconds=float(
                os.getenv("SMTP_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))
            ),
        )

    def validate(self) -> None:
        if not self.enabled:
            return
        if not self.recipient or not self.smtp_host or not self.smtp_from:
            raise RuntimeError("Lead notification SMTP configuration is incomplete.")
        if bool(self.smtp_username) != bool(self.smtp_password):
            raise RuntimeError("SMTP username and password must be configured together.")
        if not 1 <= self.smtp_port <= 65535:
            raise RuntimeError("SMTP port is invalid.")
        if not 1 <= self.smtp_timeout_seconds <= 30:
            raise RuntimeError("SMTP timeout must be between 1 and 30 seconds.")


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
    message["From"] = settings.smtp_from
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


def notify_new_public_lead(
    lead: PublicLead,
    *,
    settings: LeadNotificationSettings | None = None,
    smtp_factory: Callable[..., smtplib.SMTP] = smtplib.SMTP,
) -> bool:
    resolved_settings = settings or LeadNotificationSettings.from_environment()
    if not resolved_settings.enabled:
        return False

    resolved_settings.validate()
    message = build_public_lead_message(lead, resolved_settings)

    with smtp_factory(
        resolved_settings.smtp_host,
        resolved_settings.smtp_port,
        timeout=resolved_settings.smtp_timeout_seconds,
    ) as smtp:
        if resolved_settings.smtp_use_tls:
            smtp.starttls(context=ssl.create_default_context())
        if resolved_settings.smtp_username:
            smtp.login(
                resolved_settings.smtp_username,
                resolved_settings.smtp_password,
            )
        smtp.send_message(message)

    logger.info(
        "Public lead notification sent lead_id=%s intent=%s language=%s",
        lead.id,
        lead.intent,
        lead.language,
    )
    return True
