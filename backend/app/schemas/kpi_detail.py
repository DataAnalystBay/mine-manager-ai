from typing import List, Optional

from pydantic import BaseModel


class KpiDailyValue(BaseModel):
    date: str
    value: float


class KpiDetailResponse(BaseModel):
    kpi_name: str
    current_value: float
    target: Optional[float] = None
    unit: str = ""
    change: float
    change_percent: float
    direction: str
    period_label: str
    daily_values: List[KpiDailyValue]
    top_drivers: List[str]
    recommendations: List[str]