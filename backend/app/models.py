from sqlalchemy import (
    Column,
    Integer,
    Date,
    Numeric,
    TIMESTAMP,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ProductionDaily(Base):
    __tablename__ = "production_daily"
    __table_args__ = {"schema": "operations"}

    id = Column(Integer, primary_key=True)

    report_date = Column(Date)

    ore_plan = Column(Numeric)
    ore_actual = Column(Numeric)

    waste_plan = Column(Numeric)
    waste_actual = Column(Numeric)

    plant_feed_tonnes = Column(Numeric)
    recovery_pct = Column(Numeric)
    gold_produced_oz = Column(Numeric)
    equipment_availability_pct = Column(Numeric)
    safety_incidents = Column(Integer)

    created_at = Column(TIMESTAMP)


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    mine_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="company")


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("public.companies.id"), nullable=False)

    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    role = Column(String, default="Viewer")
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="users")