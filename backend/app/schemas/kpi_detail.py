from typing import List, Optional

from pydantic import BaseModel, Field


class KpiDailyValue(BaseModel):
    date: str
    value: float


class KpiOperationalDriver(BaseModel):
    name: str
    value: Optional[float] = None
    unit: str = ""
    change: Optional[float] = None
    direction: Optional[str] = None
    impact: Optional[str] = None
    description: str = ""


class KpiRootCause(BaseModel):
    rank: Optional[int] = None
    cause: str
    category: Optional[str] = None
    impact: Optional[str] = None
    confidence: Optional[float] = None
    evidence: Optional[str] = None
    operational_effect: Optional[str] = None


class KpiDetailResponse(BaseModel):
    kpi_name: str
    current_value: float
    target: Optional[float] = None
    unit: str = ""
    change: float
    change_percent: float
    direction: str
    period_label: str

    daily_values: List[KpiDailyValue] = Field(
        default_factory=list
    )

    operational_drivers: List[
        KpiOperationalDriver
    ] = Field(
        default_factory=list
    )

    top_drivers: List[
        KpiOperationalDriver
    ] = Field(
        default_factory=list
    )

    recommendations: List[str] = Field(
        default_factory=list
    )

    executive_insight: Optional[str] = None
    confidence: Optional[float] = None
    confidence_label: Optional[str] = None
    risk_level: Optional[str] = None

    root_causes: List[
        KpiRootCause
    ] = Field(
        default_factory=list
    )

    positive_drivers: List[str] = Field(
        default_factory=list
    )

    forecast: Optional[str] = None
