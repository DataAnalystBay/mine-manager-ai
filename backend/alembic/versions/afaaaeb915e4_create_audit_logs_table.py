"""create audit_logs table

Revision ID: afaaaeb915e4
Revises: 46815e7f86ec
Create Date: 2026-07-31

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "afaaaeb915e4"
down_revision: Union[str, Sequence[str], None] = "46815e7f86ec"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),

        sa.Column(
            "company_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "actor_user_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "actor_name",
            sa.String(255),
            nullable=True,
        ),

        sa.Column(
            "actor_email",
            sa.String(255),
            nullable=True,
        ),

        sa.Column(
            "action",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "entity_type",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "entity_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "entity_name",
            sa.String(255),
            nullable=True,
        ),

        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="SUCCESS",
        ),

        sa.Column(
            "ip_address",
            sa.String(100),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),

        sa.ForeignKeyConstraint(
            ["company_id"],
            ["public.companies.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["public.users.id"],
            ondelete="SET NULL",
        ),

        schema="public",
    )

    op.create_index(
        "ix_public_audit_logs_company_id",
        "audit_logs",
        ["company_id"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_public_audit_logs_actor_user_id",
        "audit_logs",
        ["actor_user_id"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_public_audit_logs_action",
        "audit_logs",
        ["action"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_public_audit_logs_id",
        "audit_logs",
        ["id"],
        unique=False,
        schema="public",
    )


def downgrade() -> None:

    op.drop_index(
        "ix_public_audit_logs_id",
        table_name="audit_logs",
        schema="public",
    )

    op.drop_index(
        "ix_public_audit_logs_action",
        table_name="audit_logs",
        schema="public",
    )

    op.drop_index(
        "ix_public_audit_logs_actor_user_id",
        table_name="audit_logs",
        schema="public",
    )

    op.drop_index(
        "ix_public_audit_logs_company_id",
        table_name="audit_logs",
        schema="public",
    )

    op.drop_table(
        "audit_logs",
        schema="public",
    )