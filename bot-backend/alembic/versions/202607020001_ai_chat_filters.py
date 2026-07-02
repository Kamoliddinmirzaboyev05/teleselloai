"""ai chat filters

Revision ID: 202607020001
Revises: 202607010002
Create Date: 2026-07-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202607020001"
down_revision: str | None = "202607010002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("leads", sa.Column("ai_filter", sa.String(length=50), nullable=False, server_default="default"))
    op.alter_column("leads", "ai_filter", server_default=None)


def downgrade() -> None:
    op.drop_column("leads", "ai_filter")
