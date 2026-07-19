from sqlalchemy import Column, Integer, String, Time, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ShiftPattern(Base):
    __tablename__ = "shift_patterns"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mine_settings.id", ondelete="CASCADE"))
    shift_name = Column(String(100), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    shift_type = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())