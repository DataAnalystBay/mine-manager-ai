from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    logo_url = Column(Text, nullable=True)
    primary_color = Column(String(20), default="#16A34A")
    secondary_color = Column(String(20), default="#1E293B")
    timezone = Column(String(100), default="Asia/Ulaanbaatar")
    language = Column(String(50), default="English")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())