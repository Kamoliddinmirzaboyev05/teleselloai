"""multi admin users

Revision ID: 202607010002
Revises: 202607010001
Create Date: 2026-07-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202607010002"
down_revision: str | None = "202607010001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=500), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=False)
    op.add_column("accounts", sa.Column("owner_user_id", sa.Uuid(), nullable=True))
    op.add_column("accounts", sa.Column("telegram_status", sa.String(length=50), nullable=False, server_default="disconnected"))
    op.add_column("accounts", sa.Column("telegram_last_error", sa.Text(), nullable=True))
    op.create_foreign_key("fk_accounts_owner_user_id_users", "accounts", "users", ["owner_user_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_users_account_id_accounts", "users", "accounts", ["account_id"], ["id"], ondelete="CASCADE")
    op.alter_column("users", "account_id", nullable=False)
    op.execute(
        "UPDATE accounts SET telegram_status = 'connected' "
        "WHERE telegram_api_id <> '' AND telegram_api_hash <> '' AND telegram_phone <> ''"
    )
    op.alter_column("accounts", "telegram_status", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_users_account_id_accounts", "users", type_="foreignkey")
    op.drop_constraint("fk_accounts_owner_user_id_users", "accounts", type_="foreignkey")
    op.drop_column("accounts", "telegram_last_error")
    op.drop_column("accounts", "telegram_status")
    op.drop_column("accounts", "owner_user_id")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
