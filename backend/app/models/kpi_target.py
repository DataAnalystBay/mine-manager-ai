from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class KpiTarget(Base):
    __tablename__ = "kpi_targets"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mine_settings.id", ondelete="CASCADE"))
    kpi_name = Column(String(255), nullable=False)
    kpi_category = Column(String(100))
    target_value = Column(Numeric(18, 2))
    unit = Column(String(50))
    warning_threshold = Column(Numeric(18, 2))
    critical_threshold = Column(Numeric(18, 2))
    direction = Column(String(50), default="higher_is_better")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())