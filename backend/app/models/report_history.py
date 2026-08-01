from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database import Base


class ReportHistory(Base):
    """
    Metadata record for a generated executive report.

    This first version stores generation history only.
    The generated file itself is not persisted yet.
    """

    __tablename__ = "report_history"
    __table_args__ = {"schema": "public"}

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    report_key = Column(
        String(100),
        nullable=False,
        index=True,
    )

    report_name = Column(
        String(255),
        nullable=False,
    )

    report_format = Column(
        String(20),
        nullable=False,
        index=True,
    )

    filename = Column(
        String(500),
        nullable=False,
    )

    file_size_bytes = Column(
        BigInteger,
        nullable=True,
    )

    generated_by = Column(
        String(255),
        nullable=True,
    )

    company_name = Column(
        String(255),
        nullable=True,
    )

    mine_name = Column(
        String(255),
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="completed",
        server_default="completed",
        index=True,
    )

    error_message = Column(
        Text,
        nullable=True,
    )

    generated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )