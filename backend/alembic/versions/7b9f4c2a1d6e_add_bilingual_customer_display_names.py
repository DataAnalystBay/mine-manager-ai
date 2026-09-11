"""add bilingual customer display names

Revision ID: 7b9f4c2a1d6e
Revises: 1dc4c2f2244f
Create Date: 2026-09-10
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7b9f4c2a1d6e"
down_revision: Union[str, Sequence[str], None] = "1dc4c2f2244f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for column_name in ("company_name_en", "company_name_mn"):
        op.add_column(
            "company_settings",
            sa.Column(column_name, sa.String(length=255), nullable=True),
            schema="public",
        )

    for column_name in ("mine_name_en", "mine_name_mn"):
        op.add_column(
            "mine_settings",
            sa.Column(column_name, sa.String(length=255), nullable=True),
            schema="public",
        )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE public.company_settings
            SET company_name_en = 'Achit-Ikht LLC'
            WHERE company_name = 'Achit-Ikht LLC'
              AND company_name_en IS NULL
            """
        )
    )
    connection.execute(
        sa.text(
            """
            UPDATE public.mine_settings
            SET
                mine_name_en = COALESCE(
                    mine_name_en,
                    'Achit-Ikht Copper Cathode Operation'
                ),
                mine_name_mn = COALESCE(
                    mine_name_mn,
                    'Ачит-Ихт Зэсийн Катодын Үйлдвэр'
                )
            WHERE mine_name = 'Achit-Ikht Copper Cathode Operation'
              AND (
                  mine_name_en IS NULL
                  OR mine_name_mn IS NULL
              )
            """
        )
    )


def downgrade() -> None:
    op.drop_column("mine_settings", "mine_name_mn", schema="public")
    op.drop_column("mine_settings", "mine_name_en", schema="public")
    op.drop_column("company_settings", "company_name_mn", schema="public")
    op.drop_column("company_settings", "company_name_en", schema="public")
