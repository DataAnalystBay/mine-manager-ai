"""add source and category to executive actions

Revision ID: c4e91a7b2d30
Revises: 7b9f4c2a1d6e
Create Date: 2026-09-11
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4e91a7b2d30"
down_revision: Union[str, Sequence[str], None] = "7b9f4c2a1d6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "executive_actions",
        sa.Column(
            "source",
            sa.String(length=50),
            nullable=True,
        ),
        schema="public",
    )

    op.add_column(
        "executive_actions",
        sa.Column(
            "category",
            sa.String(length=100),
            nullable=True,
        ),
        schema="public",
    )


def downgrade() -> None:
    op.drop_column(
        "executive_actions",
        "category",
        schema="public",
    )

    op.drop_column(
        "executive_actions",
        "source",
        schema="public",
    )
