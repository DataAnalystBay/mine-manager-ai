from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class RelatedExecutiveActionItem(BaseModel):
    id: int
    title: str
    status: str
    priority: str

    owner: Optional[str] = None
    due_date: Optional[date] = None


class RelatedExecutiveActionSummary(BaseModel):
    total: int = 0
    active: int = 0
    completed: int = 0

    actions: List[RelatedExecutiveActionItem] = Field(
        default_factory=list
    )


class LiveKpiContextData(BaseModel):
    kpi_key: str
    kpi_name: str
    category: str

    current_value: Optional[float] = None
    previous_value: Optional[float] = None
    target_value: Optional[float] = None

    unit: str = ""

    variance: Optional[float] = None
    variance_percentage: Optional[float] = None

    trend_value: Optional[float] = None
    trend_percentage: Optional[float] = None
    trend_direction: str = "stable"
    performance_direction: str = "stable"

    status: str = "unknown"
    higher_is_better: bool = True

    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None

    last_updated: datetime
    source: str

    related_actions: Optional[
        RelatedExecutiveActionSummary
    ] = None


class LiveKpiContextResponse(BaseModel):
    linked: bool
    message: str
    context: Optional[LiveKpiContextData] = None
