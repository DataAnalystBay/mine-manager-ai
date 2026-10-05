"""create public leads table

Revision ID: b7d2e4f6a8c1
Revises: e28c4d70a9bf
"""
from alembic import op
import sqlalchemy as sa


revision = "b7d2e4f6a8c1"
down_revision = "e28c4d70a9bf"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "public_leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("company", sa.String(length=160), nullable=False),
        sa.Column("role", sa.String(length=120), nullable=True),
        sa.Column("email_or_phone", sa.String(length=180), nullable=False),
        sa.Column("operation_type", sa.String(length=160), nullable=True),
        sa.Column("improvement_request", sa.Text(), nullable=True),
        sa.Column("intent", sa.String(length=20), server_default="contact", nullable=False),
        sa.Column("language", sa.String(length=2), server_default="MN", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        schema="public",
    )
    op.create_index(
        "ix_public_leads_created_at",
        "public_leads",
        ["created_at"],
        unique=False,
        schema="public",
    )


def downgrade():
    op.drop_index(
        "ix_public_leads_created_at",
        table_name="public_leads",
        schema="public",
    )
    op.drop_table("public_leads", schema="public")
