from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class MineSettings(Base):
    __tablename__ = "mine_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company_settings.id", ondelete="CASCADE"))
    mine_name = Column(String(255), nullable=False)
    site_code = Column(String(50))
    location = Column(String(255))
    mine_type = Column(String(100))
    shift_pattern = Column(String(100))
    operating_hours = Column(String(100))
    calendar_type = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())