"""add tenant isolation to executive actions

Revision ID: 76502933f1a7
Revises: 9857fcb80f37
Create Date: 2026-08-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "76502933f1a7"
down_revision: Union[str, Sequence[str], None] = "9857fcb80f37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ============================================================
# CONFIGURATION
# ============================================================

TABLE_NAME = "executive_actions"

OLD_UNIQUE_CONSTRAINT = (
    "uq_executive_actions_action_key"
)

NEW_UNIQUE_CONSTRAINT = (
    "uq_executive_actions_tenant_action_key"
)


# ============================================================
# UPGRADE
# ============================================================

def upgrade() -> None:
    """
    Add explicit tenant ownership to Executive Actions.

    Legacy Executive Actions were created before tenant
    isolation existed. The inspected legacy dataset contains
    Oyu Tolgoi Surface/open-pit development actions, so those
    existing rows are assigned to:

        company_id = 1
        mine_id = 1

    These IDs are used only for this one-time migration.
    Runtime application code must resolve tenant ownership
    from the authenticated user.
    """

    # --------------------------------------------------------
    # 1. Add tenant columns as nullable first
    # --------------------------------------------------------

    op.add_column(
        TABLE_NAME,
        sa.Column(
            "company_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        TABLE_NAME,
        sa.Column(
            "mine_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # --------------------------------------------------------
    # 2. Verify the legacy target tenant exists
    # --------------------------------------------------------

    connection = op.get_bind()

    target_tenant = connection.execute(
        sa.text(
            """
            SELECT
                company.id AS company_id,
                mine.id AS mine_id
            FROM public.company_settings AS company
            JOIN public.mine_settings AS mine
              ON mine.company_id = company.id
            WHERE company.id = 1
              AND mine.id = 1
              AND company.company_name = 'Oyu Tolgoi LLC'
              AND mine.mine_name = 'Oyu Tolgoi Surface'
            """
        )
    ).first()

    if target_tenant is None:
        raise RuntimeError(
            "Executive Action tenant migration aborted: "
            "expected legacy tenant "
            "'Oyu Tolgoi LLC / Oyu Tolgoi Surface' "
            "(company_id=1, mine_id=1) was not found."
        )

    # --------------------------------------------------------
    # 3. Backfill legacy Executive Actions
    # --------------------------------------------------------

    op.execute(
        sa.text(
            """
            UPDATE public.executive_actions
            SET
                company_id = 1,
                mine_id = 1
            WHERE company_id IS NULL
               OR mine_id IS NULL
            """
        )
    )

    # --------------------------------------------------------
    # 4. Verify every legacy row was mapped
    # --------------------------------------------------------

    unmatched_count = connection.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM public.executive_actions
            WHERE company_id IS NULL
               OR mine_id IS NULL
            """
        )
    ).scalar_one()

    if unmatched_count > 0:
        raise RuntimeError(
            "Executive Action tenant migration aborted: "
            f"{unmatched_count} row(s) could not be "
            "assigned to a tenant."
        )

    # --------------------------------------------------------
    # 5. Add foreign keys
    # --------------------------------------------------------

    op.create_foreign_key(
        "fk_executive_actions_company_id",
        TABLE_NAME,
        "company_settings",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.create_foreign_key(
        "fk_executive_actions_mine_id",
        TABLE_NAME,
        "mine_settings",
        ["mine_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    # --------------------------------------------------------
    # 6. Replace global action_key uniqueness
    #
    # OLD:
    #     action_key
    #
    # NEW:
    #     company_id + mine_id + action_key
    # --------------------------------------------------------

    op.drop_index(
        "ix_executive_actions_action_key",
        table_name=TABLE_NAME,
    )

    op.drop_constraint(
        OLD_UNIQUE_CONSTRAINT,
        TABLE_NAME,
        type_="unique",
    )

    # Keep action_key searchable, but no longer globally unique.
    op.create_index(
        "ix_executive_actions_action_key",
        TABLE_NAME,
        ["action_key"],
        unique=False,
    )

    op.create_unique_constraint(
        NEW_UNIQUE_CONSTRAINT,
        TABLE_NAME,
        [
            "company_id",
            "mine_id",
            "action_key",
        ],
    )

    # --------------------------------------------------------
    # 7. Tenant ownership is mandatory
    # --------------------------------------------------------

    op.alter_column(
        TABLE_NAME,
        "company_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.alter_column(
        TABLE_NAME,
        "mine_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # --------------------------------------------------------
    # 8. Add tenant indexes
    # --------------------------------------------------------

    op.create_index(
        "ix_executive_actions_company_id",
        TABLE_NAME,
        ["company_id"],
        unique=False,
    )

    op.create_index(
        "ix_executive_actions_mine_id",
        TABLE_NAME,
        ["mine_id"],
        unique=False,
    )

    op.create_index(
        "ix_executive_actions_tenant",
        TABLE_NAME,
        [
            "company_id",
            "mine_id",
        ],
        unique=False,
    )

    op.create_index(
        "ix_executive_actions_tenant_status",
        TABLE_NAME,
        [
            "company_id",
            "mine_id",
            "status",
        ],
        unique=False,
    )


# ============================================================
# DOWNGRADE
# ============================================================

def downgrade() -> None:
    """
    Restore the previous Executive Actions structure.

    WARNING:
        Downgrade restores global action_key uniqueness.

        If two tenants have created the same action_key after
        this migration, downgrade cannot safely restore the
        old global uniqueness and will abort.
    """

    connection = op.get_bind()

    # --------------------------------------------------------
    # 1. Verify global action_key uniqueness can be restored
    # --------------------------------------------------------

    duplicate_action_keys = connection.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM (
                SELECT action_key
                FROM public.executive_actions
                GROUP BY action_key
                HAVING COUNT(*) > 1
            ) AS duplicates
            """
        )
    ).scalar_one()

    if duplicate_action_keys > 0:
        raise RuntimeError(
            "Executive Action downgrade aborted: "
            f"{duplicate_action_keys} action_key value(s) "
            "exist in more than one tenant. "
            "Global action_key uniqueness cannot be "
            "restored safely."
        )

    # --------------------------------------------------------
    # 2. Remove tenant indexes
    # --------------------------------------------------------

    op.drop_index(
        "ix_executive_actions_tenant_status",
        table_name=TABLE_NAME,
    )

    op.drop_index(
        "ix_executive_actions_tenant",
        table_name=TABLE_NAME,
    )

    op.drop_index(
        "ix_executive_actions_mine_id",
        table_name=TABLE_NAME,
    )

    op.drop_index(
        "ix_executive_actions_company_id",
        table_name=TABLE_NAME,
    )

    # --------------------------------------------------------
    # 3. Restore global action_key uniqueness
    # --------------------------------------------------------

    op.drop_constraint(
        NEW_UNIQUE_CONSTRAINT,
        TABLE_NAME,
        type_="unique",
    )

    op.drop_index(
        "ix_executive_actions_action_key",
        table_name=TABLE_NAME,
    )

    op.create_unique_constraint(
        OLD_UNIQUE_CONSTRAINT,
        TABLE_NAME,
        ["action_key"],
    )

    op.create_index(
        "ix_executive_actions_action_key",
        TABLE_NAME,
        ["action_key"],
        unique=True,
    )

    # --------------------------------------------------------
    # 4. Remove foreign keys
    # --------------------------------------------------------

    op.drop_constraint(
        "fk_executive_actions_mine_id",
        TABLE_NAME,
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_executive_actions_company_id",
        TABLE_NAME,
        type_="foreignkey",
    )

    # --------------------------------------------------------
    # 5. Remove tenant columns
    # --------------------------------------------------------

    op.drop_column(
        TABLE_NAME,
        "mine_id",
    )

    op.drop_column(
        TABLE_NAME,
        "company_id",
    )