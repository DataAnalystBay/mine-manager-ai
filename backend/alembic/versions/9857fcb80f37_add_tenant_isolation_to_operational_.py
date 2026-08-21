"""add tenant isolation to operational tables

Revision ID: 9857fcb80f37
Revises: afaaaeb915e4
Create Date: 2026-08-20 18:23:11.844921

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9857fcb80f37"
down_revision: Union[str, Sequence[str], None] = "afaaaeb915e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ============================================================
# OPERATIONAL TABLE CONFIGURATION
# ============================================================

OPERATIONAL_TABLES = [
    "production_daily",
    "plant_daily",
    "safety_daily",
    "fleet_daily",
]


OLD_UNIQUE_CONSTRAINTS = {
    "production_daily": "uq_production_daily_mine_date",
    "plant_daily": "plant_daily_mine_date_unique",
    "safety_daily": "safety_daily_mine_date_unique",
    "fleet_daily": "fleet_daily_mine_date_unique",
}


NEW_UNIQUE_CONSTRAINTS = {
    "production_daily": "uq_production_daily_tenant_date",
    "plant_daily": "uq_plant_daily_tenant_date",
    "safety_daily": "uq_safety_daily_tenant_date",
    "fleet_daily": "uq_fleet_daily_tenant_date",
}


# ============================================================
# UPGRADE
# ============================================================

def upgrade() -> None:
    """
    Upgrade operational tables from mine-name isolation to
    explicit company_id + mine_id tenant isolation.

    The migration intentionally keeps mine_name for backward
    compatibility with current V1.0 code.
    """

    # --------------------------------------------------------
    # 1. Add tenant columns as nullable first
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.add_column(
            table_name,
            sa.Column(
                "company_id",
                sa.Integer(),
                nullable=True,
            ),
        )

        op.add_column(
            table_name,
            sa.Column(
                "mine_id",
                sa.Integer(),
                nullable=True,
            ),
        )

    # --------------------------------------------------------
    # 2. Backfill company_id and mine_id
    #
    # Existing operational rows contain mine_name.
    #
    # mine_settings contains:
    #
    #     id
    #     company_id
    #     mine_name
    #
    # Therefore existing operational rows can be mapped safely
    # through mine_settings.
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.execute(
            sa.text(
                f"""
                UPDATE public.{table_name} AS operational
                SET
                    company_id = mine.company_id,
                    mine_id = mine.id
                FROM public.mine_settings AS mine
                WHERE operational.mine_name = mine.mine_name
                  AND (
                        operational.company_id IS NULL
                        OR operational.mine_id IS NULL
                  )
                """
            )
        )

    # --------------------------------------------------------
    # 3. Verify every row was mapped
    #
    # Abort the migration if any legacy row cannot be linked
    # to a configured company/mine.
    # --------------------------------------------------------

    connection = op.get_bind()

    for table_name in OPERATIONAL_TABLES:
        unmatched_count = connection.execute(
            sa.text(
                f"""
                SELECT COUNT(*)
                FROM public.{table_name}
                WHERE company_id IS NULL
                   OR mine_id IS NULL
                """
            )
        ).scalar_one()

        if unmatched_count > 0:
            raise RuntimeError(
                "Tenant isolation migration aborted: "
                f"{table_name} contains "
                f"{unmatched_count} row(s) that could not "
                "be mapped to company_settings / mine_settings."
            )

    # --------------------------------------------------------
    # 4. Add foreign keys
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.create_foreign_key(
            f"fk_{table_name}_company_id",
            table_name,
            "company_settings",
            ["company_id"],
            ["id"],
            ondelete="RESTRICT",
        )

        op.create_foreign_key(
            f"fk_{table_name}_mine_id",
            table_name,
            "mine_settings",
            ["mine_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    # --------------------------------------------------------
    # 5. Replace legacy uniqueness
    #
    # OLD:
    #     mine_name + report_date
    #
    # NEW:
    #     company_id + mine_id + report_date
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.drop_constraint(
            OLD_UNIQUE_CONSTRAINTS[table_name],
            table_name,
            type_="unique",
        )

        op.create_unique_constraint(
            NEW_UNIQUE_CONSTRAINTS[table_name],
            table_name,
            [
                "company_id",
                "mine_id",
                "report_date",
            ],
        )

    # --------------------------------------------------------
    # 6. Tenant IDs are now mandatory
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.alter_column(
            table_name,
            "company_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

        op.alter_column(
            table_name,
            "mine_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

    # --------------------------------------------------------
    # 7. Add tenant indexes
    #
    # Individual indexes are useful for filtering and joins.
    # The combined tenant/date index supports the most common
    # operational query pattern.
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.create_index(
            f"ix_{table_name}_company_id",
            table_name,
            ["company_id"],
            unique=False,
        )

        op.create_index(
            f"ix_{table_name}_mine_id",
            table_name,
            ["mine_id"],
            unique=False,
        )

        op.create_index(
            f"ix_{table_name}_tenant_date",
            table_name,
            [
                "company_id",
                "mine_id",
                "report_date",
            ],
            unique=False,
        )


# ============================================================
# DOWNGRADE
# ============================================================

def downgrade() -> None:
    """
    Restore the previous V1.0 structure.

    This removes company_id and mine_id and returns uniqueness
    to mine_name + report_date.
    """

    # --------------------------------------------------------
    # 1. Remove indexes
    # --------------------------------------------------------

    for table_name in reversed(OPERATIONAL_TABLES):
        op.drop_index(
            f"ix_{table_name}_tenant_date",
            table_name=table_name,
        )

        op.drop_index(
            f"ix_{table_name}_mine_id",
            table_name=table_name,
        )

        op.drop_index(
            f"ix_{table_name}_company_id",
            table_name=table_name,
        )

    # --------------------------------------------------------
    # 2. Restore legacy unique constraints
    # --------------------------------------------------------

    for table_name in OPERATIONAL_TABLES:
        op.drop_constraint(
            NEW_UNIQUE_CONSTRAINTS[table_name],
            table_name,
            type_="unique",
        )

        op.create_unique_constraint(
            OLD_UNIQUE_CONSTRAINTS[table_name],
            table_name,
            [
                "mine_name",
                "report_date",
            ],
        )

    # --------------------------------------------------------
    # 3. Remove foreign keys
    # --------------------------------------------------------

    for table_name in reversed(OPERATIONAL_TABLES):
        op.drop_constraint(
            f"fk_{table_name}_mine_id",
            table_name,
            type_="foreignkey",
        )

        op.drop_constraint(
            f"fk_{table_name}_company_id",
            table_name,
            type_="foreignkey",
        )

    # --------------------------------------------------------
    # 4. Remove tenant columns
    # --------------------------------------------------------

    for table_name in reversed(OPERATIONAL_TABLES):
        op.drop_column(
            table_name,
            "mine_id",
        )

        op.drop_column(
            table_name,
            "company_id",
        )