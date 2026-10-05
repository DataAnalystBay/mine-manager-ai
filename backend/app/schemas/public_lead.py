import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^[+\d\s().-]+$")


class PublicLeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str = Field(min_length=1, max_length=160)
    role: Optional[str] = Field(default=None, max_length=120)
    email_or_phone: str = Field(min_length=3, max_length=180)
    operation_type: Optional[str] = Field(default=None, max_length=160)
    improvement_request: Optional[str] = Field(default=None, max_length=2000)
    intent: str = Field(default="contact", max_length=20)
    language: str = Field(default="MN", max_length=10)
    website: Optional[str] = Field(default=None, max_length=200)

    @field_validator("name", "company")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value cannot be empty.")
        return cleaned

    @field_validator("role", "operation_type", "improvement_request", "website")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("email_or_phone")
    @classmethod
    def validate_email_or_phone(cls, value: str) -> str:
        cleaned = value.strip()
        digits = re.sub(r"\D", "", cleaned)
        is_email = bool(EMAIL_PATTERN.fullmatch(cleaned))
        is_phone = bool(PHONE_PATTERN.fullmatch(cleaned)) and len(digits) >= 7
        if not is_email and not is_phone:
            raise ValueError("Enter a valid email address or phone number.")
        return cleaned

    @field_validator("intent", mode="before")
    @classmethod
    def normalize_intent(cls, value) -> str:
        return "demo" if str(value or "").strip().lower() == "demo" else "contact"

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language(cls, value) -> str:
        normalized = str(value or "").strip().upper()
        return normalized if normalized in {"MN", "EN"} else "MN"


class PublicLeadResponse(BaseModel):
    success: bool = True
    lead_id: Optional[int] = None
    message: str = "Lead received"
