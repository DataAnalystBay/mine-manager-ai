"""add tenant isolation to report history

Revision ID: d53bfe4f70e7
Revises: 76502933f1a7
Create Date: 2026-08-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d53bfe4f70e7"
down_revision: Union[str, Sequence[str], None] = "76502933f1a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLE_NAME = "report_history"


def upgrade() -> None:
    """
    Add immutable tenant ownership to report_history.

    Existing rows are mapped using their historical
    company_name + mine_name values.

    Expected existing tenant mappings:

        Oyu Tolgoi LLC
        + Oyu Tolgoi Surface
        -> company_id = 1
        -> mine_id = 1

        Achit-Ikht LLC
        + Achit-Ikht Copper Cathode Operation
        -> company_id = 2
        -> mine_id = 2

    Runtime application code must never depend on these
    hardcoded IDs. They are used only for this one-time
    migration.
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
        schema="public",
    )

    op.add_column(
        TABLE_NAME,
        sa.Column(
            "mine_id",
            sa.Integer(),
            nullable=True,
        ),
        schema="public",
    )

    connection = op.get_bind()

    # --------------------------------------------------------
    # 2. Verify expected configured tenants exist
    # --------------------------------------------------------

    ot_tenant = connection.execute(
        sa.text(
            """
            SELECT
                c.id AS company_id,
                m.id AS mine_id
            FROM public.company_settings AS c
            JOIN public.mine_settings AS m
              ON m.company_id = c.id
            WHERE c.id = 1
              AND m.id = 1
              AND c.company_name = 'Oyu Tolgoi LLC'
              AND m.mine_name = 'Oyu Tolgoi Surface'
            """
        )
    ).first()

    if ot_tenant is None:
        raise RuntimeError(
            "Report history tenant migration aborted: "
            "expected Oyu Tolgoi tenant "
            "(company_id=1, mine_id=1) was not found."
        )

    achit_tenant = connection.execute(
        sa.text(
            """
            SELECT
                c.id AS company_id,
                m.id AS mine_id
            FROM public.company_settings AS c
            JOIN public.mine_settings AS m
              ON m.company_id = c.id
            WHERE c.id = 2
              AND m.id = 2
              AND c.company_name = 'Achit-Ikht LLC'
              AND m.mine_name =
                  'Achit-Ikht Copper Cathode Operation'
            """
        )
    ).first()

    if achit_tenant is None:
        raise RuntimeError(
            "Report history tenant migration aborted: "
            "expected Achit-Ikht tenant "
            "(company_id=2, mine_id=2) was not found."
        )

    # --------------------------------------------------------
    # 3. Backfill Oyu Tolgoi history
    # --------------------------------------------------------

    op.execute(
        sa.text(
            """
            UPDATE public.report_history
            SET
                company_id = 1,
                mine_id = 1
            WHERE company_name = 'Oyu Tolgoi LLC'
              AND mine_name = 'Oyu Tolgoi Surface'
              AND (
                    company_id IS NULL
                    OR mine_id IS NULL
                  )
            """
        )
    )

    # --------------------------------------------------------
    # 4. Backfill Achit-Ikht history
    # --------------------------------------------------------

    op.execute(
        sa.text(
            """
            UPDATE public.report_history
            SET
                company_id = 2,
                mine_id = 2
            WHERE company_name = 'Achit-Ikht LLC'
              AND mine_name =
                  'Achit-Ikht Copper Cathode Operation'
              AND (
                    company_id IS NULL
                    OR mine_id IS NULL
                  )
            """
        )
    )

    # --------------------------------------------------------
    # 5. Verify no history rows remain unmapped
    # --------------------------------------------------------

    unmatched_rows = connection.execute(
        sa.text(
            """
            SELECT
                id,
                company_name,
                mine_name
            FROM public.report_history
            WHERE company_id IS NULL
               OR mine_id IS NULL
            ORDER BY id
            """
        )
    ).mappings().all()

    if unmatched_rows:
        preview = ", ".join(
            (
                f"id={row['id']} "
                f"company={row['company_name']} "
                f"mine={row['mine_name']}"
            )
            for row in unmatched_rows[:10]
        )

        raise RuntimeError(
            "Report history tenant migration aborted: "
            f"{len(unmatched_rows)} row(s) could not be "
            f"mapped to a configured tenant. "
            f"Examples: {preview}"
        )

    # --------------------------------------------------------
    # 6. Add foreign keys
    # --------------------------------------------------------

    op.create_foreign_key(
        "fk_report_history_company_id",
        TABLE_NAME,
        "company_settings",
        ["company_id"],
        ["id"],
        source_schema="public",
        referent_schema="public",
        ondelete="RESTRICT",
    )

    op.create_foreign_key(
        "fk_report_history_mine_id",
        TABLE_NAME,
        "mine_settings",
        ["mine_id"],
        ["id"],
        source_schema="public",
        referent_schema="public",
        ondelete="RESTRICT",
    )

    # --------------------------------------------------------
    # 7. Make tenant ownership mandatory
    # --------------------------------------------------------

    op.alter_column(
        TABLE_NAME,
        "company_id",
        existing_type=sa.Integer(),
        nullable=False,
        schema="public",
    )

    op.alter_column(
        TABLE_NAME,
        "mine_id",
        existing_type=sa.Integer(),
        nullable=False,
        schema="public",
    )

    # --------------------------------------------------------
    # 8. Add tenant indexes
    # --------------------------------------------------------

    op.create_index(
        "ix_report_history_company_id",
        TABLE_NAME,
        ["company_id"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_report_history_mine_id",
        TABLE_NAME,
        ["mine_id"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_report_history_tenant",
        TABLE_NAME,
        [
            "company_id",
            "mine_id",
        ],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_report_history_tenant_generated_at",
        TABLE_NAME,
        [
            "company_id",
            "mine_id",
            "generated_at",
        ],
        unique=False,
        schema="public",
    )


def downgrade() -> None:
    """
    Remove report-history tenant ownership and restore the
    previous metadata-only table structure.
    """

    op.drop_index(
        "ix_report_history_tenant_generated_at",
        table_name=TABLE_NAME,
        schema="public",
    )

    op.drop_index(
        "ix_report_history_tenant",
        table_name=TABLE_NAME,
        schema="public",
    )

    op.drop_index(
        "ix_report_history_mine_id",
        table_name=TABLE_NAME,
        schema="public",
    )

    op.drop_index(
        "ix_report_history_company_id",
        table_name=TABLE_NAME,
        schema="public",
    )

    op.drop_constraint(
        "fk_report_history_mine_id",
        TABLE_NAME,
        type_="foreignkey",
        schema="public",
    )

    op.drop_constraint(
        "fk_report_history_company_id",
        TABLE_NAME,
        type_="foreignkey",
        schema="public",
    )

    op.drop_column(
        TABLE_NAME,
        "mine_id",
        schema="public",
    )

    op.drop_column(
        TABLE_NAME,
        "company_id",
        schema="public",
    )