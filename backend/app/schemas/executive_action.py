from datetime import date, datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


ALLOWED_STATUSES = {
    "open",
    "in_progress",
    "completed",
    "blocked",
}

ALLOWED_PRIORITIES = {
    "low",
    "medium",
    "high",
    "critical",
}


class ExecutiveActionBase(BaseModel):
    action_key: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    kpi_key: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    kpi_name: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    linked_cause: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    title: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    description: Optional[str] = None

    priority: str = Field(
        default="medium",
        max_length=50,
    )

    owner: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    timing: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    expected_benefit: Optional[str] = None

    status: str = Field(
        default="open",
        max_length=50,
    )

    due_date: Optional[date] = None

    @field_validator(
        "action_key",
        "kpi_key",
        "title",
    )
    @classmethod
    def validate_required_text(
        cls,
        value: str,
    ) -> str:
        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Value cannot be empty."
            )

        return cleaned_value

    @field_validator("priority")
    @classmethod
    def validate_priority(
        cls,
        value: str,
    ) -> str:
        normalized_value = (
            value.strip()
            .lower()
            .replace(" ", "_")
        )

        if (
            normalized_value
            not in ALLOWED_PRIORITIES
        ):
            raise ValueError(
                "Priority must be low, medium, "
                "high, or critical."
            )

        return normalized_value

    @field_validator("status")
    @classmethod
    def validate_status(
        cls,
        value: str,
    ) -> str:
        normalized_value = (
            value.strip()
            .lower()
            .replace(" ", "_")
        )

        if (
            normalized_value
            not in ALLOWED_STATUSES
        ):
            raise ValueError(
                "Status must be open, "
                "in_progress, completed, "
                "or blocked."
            )

        return normalized_value


class ExecutiveActionCreate(
    ExecutiveActionBase
):
    pass


class ExecutiveActionUpdate(BaseModel):
    kpi_name: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    linked_cause: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=500,
    )

    description: Optional[str] = None

    priority: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    owner: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    timing: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    expected_benefit: Optional[str] = None

    status: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def validate_title(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return value

        cleaned_value = value.strip()

        if not cleaned_value:
            raise ValueError(
                "Title cannot be empty."
            )

        return cleaned_value

    @field_validator("priority")
    @classmethod
    def validate_priority(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return value

        normalized_value = (
            value.strip()
            .lower()
            .replace(" ", "_")
        )

        if (
            normalized_value
            not in ALLOWED_PRIORITIES
        ):
            raise ValueError(
                "Priority must be low, medium, "
                "high, or critical."
            )

        return normalized_value

    @field_validator("status")
    @classmethod
    def validate_status(
        cls,
        value: Optional[str],
    ) -> Optional[str]:
        if value is None:
            return value

        normalized_value = (
            value.strip()
            .lower()
            .replace(" ", "_")
        )

        if (
            normalized_value
            not in ALLOWED_STATUSES
        ):
            raise ValueError(
                "Status must be open, "
                "in_progress, completed, "
                "or blocked."
            )

        return normalized_value


class ExecutiveActionStatusUpdate(
    BaseModel
):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(
        cls,
        value: str,
    ) -> str:
        normalized_value = (
            value.strip()
            .lower()
            .replace(" ", "_")
        )

        if (
            normalized_value
            not in ALLOWED_STATUSES
        ):
            raise ValueError(
                "Status must be open, "
                "in_progress, completed, "
                "or blocked."
            )

        return normalized_value


class ExecutiveActionResponse(
    ExecutiveActionBase
):
    id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class ExecutiveActionSummary(
    BaseModel
):
    total: int
    open: int
    in_progress: int
    completed: int
    blocked: int
    completion_percentage: float

    due_today: int
    overdue: int
    high_priority: int
    completed_this_month: int
    average_days_to_close: float


class ExecutiveActionAnalytics(
    BaseModel
):
    completion_rate: float
    average_days_to_close: float
    overdue_percentage: float

    active_actions: int
    critical_actions: int
    blocked_actions: int

    actions_by_priority: dict[str, int]
    actions_by_status: dict[str, int]

    top_owners: list[dict]
    top_kpis: list[dict]