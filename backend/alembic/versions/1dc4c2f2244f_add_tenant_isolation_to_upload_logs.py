"""add tenant isolation to upload logs

Revision ID: 1dc4c2f2244f
Revises: d53bfe4f70e7
Create Date: 2026-08-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1dc4c2f2244f"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "d53bfe4f70e7"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    """
    Add tenant ownership to upload_logs.

    Historical upload-log rows cannot be assigned safely to
    a company/mine because the legacy table did not persist
    tenant ownership. They intentionally remain NULL.

    All new upload-log records will receive company_id and
    mine_id from the authenticated tenant.
    """

    op.add_column(
        "upload_logs",
        sa.Column(
            "company_id",
            sa.Integer(),
            nullable=True,
        ),
        schema="public",
    )

    op.add_column(
        "upload_logs",
        sa.Column(
            "mine_id",
            sa.Integer(),
            nullable=True,
        ),
        schema="public",
    )

    op.create_index(
        "ix_upload_logs_company_id",
        "upload_logs",
        ["company_id"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_upload_logs_mine_id",
        "upload_logs",
        ["mine_id"],
        unique=False,
        schema="public",
    )

    op.create_index(
        "ix_upload_logs_tenant",
        "upload_logs",
        [
            "company_id",
            "mine_id",
        ],
        unique=False,
        schema="public",
    )


def downgrade() -> None:
    """
    Remove upload-log tenant ownership.
    """

    op.drop_index(
        "ix_upload_logs_tenant",
        table_name="upload_logs",
        schema="public",
    )

    op.drop_index(
        "ix_upload_logs_mine_id",
        table_name="upload_logs",
        schema="public",
    )

    op.drop_index(
        "ix_upload_logs_company_id",
        table_name="upload_logs",
        schema="public",
    )

    op.drop_column(
        "upload_logs",
        "mine_id",
        schema="public",
    )

    op.drop_column(
        "upload_logs",
        "company_id",
        schema="public",
    )