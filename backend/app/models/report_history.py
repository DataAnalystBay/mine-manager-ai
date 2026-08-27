from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database import Base


class ReportHistory(Base):
    """
    Metadata record for a generated executive report.

    Tenant boundary:
        company_id + mine_id

    company_name and mine_name are retained as historical
    display/branding fields, but tenant security is enforced
    using immutable IDs.
    """

    __tablename__ = "report_history"

    __table_args__ = (
        Index(
            "ix_report_history_tenant",
            "company_id",
            "mine_id",
        ),
        Index(
            "ix_report_history_tenant_generated_at",
            "company_id",
            "mine_id",
            "generated_at",
        ),
        {
            "schema": "public",
        },
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_id = Column(
        Integer,
        ForeignKey(
            "company_settings.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    mine_id = Column(
        Integer,
        ForeignKey(
            "mine_settings.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
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

    def __repr__(self) -> str:
        return (
            f"<ReportHistory("
            f"id={self.id}, "
            f"company_id={self.company_id}, "
            f"mine_id={self.mine_id}, "
            f"report_key='{self.report_key}', "
            f"status='{self.status}'"
            f")>"
        )