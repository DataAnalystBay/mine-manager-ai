from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = {"schema": "public"}

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_name = Column(
        String(255),
        nullable=False,
    )

    mine_name = Column(
        String(255),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        nullable=True,
        default=True,
        server_default="true",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=True,
        server_default=func.now(),
    )

    users = relationship(
        "User",
        back_populates="company",
        cascade="all, delete-orphan",
    )