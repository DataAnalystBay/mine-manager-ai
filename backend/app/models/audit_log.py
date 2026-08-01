from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "public"}

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_id = Column(
        Integer,
        ForeignKey(
            "public.companies.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    actor_user_id = Column(
        Integer,
        ForeignKey(
            "public.users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    actor_name = Column(
        String(255),
        nullable=True,
    )

    actor_email = Column(
        String(255),
        nullable=True,
    )

    action = Column(
        String(100),
        nullable=False,
        index=True,
    )

    entity_type = Column(
        String(100),
        nullable=False,
    )

    entity_id = Column(
        Integer,
        nullable=True,
    )

    entity_name = Column(
        String(255),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        server_default="SUCCESS",
    )

    ip_address = Column(
        String(100),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )