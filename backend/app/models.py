from sqlalchemy.orm import declarative_base
from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import Date
from sqlalchemy import Numeric
from sqlalchemy import TIMESTAMP

Base = declarative_base()

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