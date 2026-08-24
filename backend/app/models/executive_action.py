from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.database import Base


class ExecutiveAction(Base):
    """
    Persistent executive action generated from an AI
    recommendation or entered manually by a mine-management
    user.

    Tenant boundary:
        company_id + mine_id

    action_key is unique only inside a tenant. This allows
    different mining companies to receive the same logical
    recommendation without sharing action records.
    """

    __tablename__ = "executive_actions"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "mine_id",
            "action_key",
            name=(
                "uq_executive_actions_"
                "tenant_action_key"
            ),
        ),
        Index(
            "ix_executive_actions_tenant",
            "company_id",
            "mine_id",
        ),
        Index(
            "ix_executive_actions_"
            "tenant_status",
            "company_id",
            "mine_id",
            "status",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ---------------------------------------------------------
    # Tenant ownership
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Action identity
    # ---------------------------------------------------------

    # Stable frontend/backend identifier used to prevent
    # duplicate actions inside the same tenant.
    action_key = Column(
        String(255),
        nullable=False,
        index=True,
    )

    # KPI that generated the recommendation:
    # production, fleet, plant, safety, etc.
    kpi_key = Column(
        String(100),
        nullable=False,
        index=True,
    )

    kpi_name = Column(
        String(255),
        nullable=True,
    )

    # Optional link to the root-cause label shown in the
    # Executive KPI dialog, for example P1, P2, or P3.
    linked_cause = Column(
        String(50),
        nullable=True,
    )

    title = Column(
        String(500),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    priority = Column(
        String(50),
        nullable=False,
        default="medium",
    )

    owner = Column(
        String(255),
        nullable=True,
    )

    timing = Column(
        String(255),
        nullable=True,
    )

    expected_benefit = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="open",
        index=True,
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return (
            f"<ExecutiveAction("
            f"id={self.id}, "
            f"company_id={self.company_id}, "
            f"mine_id={self.mine_id}, "
            f"action_key='{self.action_key}', "
            f"status='{self.status}'"
            f")>"
        )