from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class PublicLead(Base):
    __tablename__ = "public_leads"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    company = Column(String(160), nullable=False)
    role = Column(String(120), nullable=True)
    email_or_phone = Column(String(180), nullable=False)
    operation_type = Column(String(160), nullable=True)
    improvement_request = Column(Text, nullable=True)
    intent = Column(String(20), nullable=False, server_default="contact")
    language = Column(String(2), nullable=False, server_default="MN")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
