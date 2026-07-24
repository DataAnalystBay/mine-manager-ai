from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
)
from sqlalchemy.sql import func

from app.database import Base


class ExecutiveAction(Base):
    """
    Persistent executive action generated from an AI recommendation
    or entered manually by a mine-management user.
    """

    __tablename__ = "executive_actions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Stable frontend/backend identifier used to prevent duplicate
    # actions when the same recommendation is displayed again.
    action_key = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # KPI that generated the recommendation:
    # ore, waste, fleet, plant, safety, etc.
    kpi_key = Column(
        String(100),
        nullable=False,
        index=True,
    )

    kpi_name = Column(
        String(255),
        nullable=True,
    )

    # Optional link to the root-cause label shown in the dialog,
    # for example P1, P2, or P3.
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
            f"action_key='{self.action_key}', "
            f"status='{self.status}'"
            f")>"
        )