"""Create persisted assignment drafts.

Revision ID: 20260918_0001
Revises:
Create Date: 2026-09-18
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260918_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assignment_drafts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("group_name", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("request_payload", sa.JSON(), nullable=False),
        sa.Column("result_payload", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_assignment_drafts_group_name"),
        "assignment_drafts",
        ["group_name"],
    )
    op.create_index(
        op.f("ix_assignment_drafts_status"),
        "assignment_drafts",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_assignment_drafts_status"), table_name="assignment_drafts")
    op.drop_index(op.f("ix_assignment_drafts_group_name"), table_name="assignment_drafts")
    op.drop_table("assignment_drafts")
