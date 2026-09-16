"""add nullable coal profile operational fields

Revision ID: e28c4d70a9bf
Revises: c4e91a7b2d30
"""
from alembic import op
import sqlalchemy as sa

revision = "e28c4d70a9bf"
down_revision = "c4e91a7b2d30"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("kpi_targets", sa.Column("kpi_code", sa.String(100), nullable=True), schema="public")
    op.add_column("kpi_targets", sa.Column("is_executive", sa.Boolean(), nullable=True, server_default=sa.false()), schema="public")
    op.add_column("kpi_targets", sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.true()), schema="public")
    for name in ("product_coal", "ash_pct", "moisture_pct", "calorific_value"):
        op.add_column("production_daily", sa.Column(name, sa.Numeric(), nullable=True), schema="public")
    op.add_column("plant_daily", sa.Column("availability", sa.Numeric(), nullable=True), schema="public")

def downgrade():
    op.drop_column("plant_daily", "availability", schema="public")
    for name in reversed(("product_coal", "ash_pct", "moisture_pct", "calorific_value")):
        op.drop_column("production_daily", name, schema="public")
    op.drop_column("kpi_targets", "is_active", schema="public")
    op.drop_column("kpi_targets", "is_executive", schema="public")
    op.drop_column("kpi_targets", "kpi_code", schema="public")
