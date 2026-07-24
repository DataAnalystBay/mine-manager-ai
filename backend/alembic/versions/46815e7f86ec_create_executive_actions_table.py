"""create executive actions table

Revision ID: 46815e7f86ec
Revises: 4660dbe88875
Create Date: 2026-07-20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision: str = "46815e7f86ec"
down_revision: Union[str, None] = "4660dbe88875"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "executive_actions",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "action_key",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "kpi_key",
            sa.String(length=100),
            nullable=False,
        ),

        sa.Column(
            "kpi_name",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "linked_cause",
            sa.String(length=50),
            nullable=True,
        ),

        sa.Column(
            "title",
            sa.String(length=500),
            nullable=False,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "priority",
            sa.String(length=50),
            nullable=False,
            server_default="medium",
        ),

        sa.Column(
            "owner",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "timing",
            sa.String(length=255),
            nullable=True,
        ),

        sa.Column(
            "expected_benefit",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
            server_default="open",
        ),

        sa.Column(
            "due_date",
            sa.Date(),
            nullable=True,
        ),

        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),

        sa.UniqueConstraint(
            "action_key",
            name="uq_executive_actions_action_key",
        ),
    )

    op.create_index(
        "ix_executive_actions_id",
        "executive_actions",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_executive_actions_action_key",
        "executive_actions",
        ["action_key"],
        unique=True,
    )

    op.create_index(
        "ix_executive_actions_kpi_key",
        "executive_actions",
        ["kpi_key"],
        unique=False,
    )

    op.create_index(
        "ix_executive_actions_status",
        "executive_actions",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_executive_actions_status",
        table_name="executive_actions",
    )

    op.drop_index(
        "ix_executive_actions_kpi_key",
        table_name="executive_actions",
    )

    op.drop_index(
        "ix_executive_actions_action_key",
        table_name="executive_actions",
    )

    op.drop_index(
        "ix_executive_actions_id",
        table_name="executive_actions",
    )

    op.drop_table("executive_actions")