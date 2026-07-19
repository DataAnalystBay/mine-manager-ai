from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mine_settings.id", ondelete="CASCADE"))
    alert_name = Column(String(255), nullable=False)
    kpi_name = Column(String(255))
    warning_value = Column(Numeric(18, 2))
    critical_value = Column(Numeric(18, 2))
    unit = Column(String(50))
    alert_level = Column(String(50), default="medium")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())