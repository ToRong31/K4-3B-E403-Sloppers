"""Add ai chat messages table

Revision ID: 20260919_0004
Revises: 20260919_0003
Create Date: 2026-09-19
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260919_0004"
down_revision: str | None = "20260919_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_chat_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("thread_id", sa.String(length=160), nullable=False),
        sa.Column("user_id", sa.String(length=100), nullable=True),
        sa.Column("group_id", sa.String(length=100), nullable=True),
        sa.Column("lab_id", sa.String(length=160), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=40), nullable=True),
        sa.Column("suggested_next_action", sa.Text(), nullable=True),
        sa.Column("task_ids", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("reference_ids", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("file_size", sa.String(length=50), nullable=True),
        sa.Column("file_type", sa.String(length=100), nullable=True),
        sa.Column("file_data", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_chat_messages_thread_id"), "ai_chat_messages", ["thread_id"])
    op.create_index(op.f("ix_ai_chat_messages_user_id"), "ai_chat_messages", ["user_id"])
    op.create_index(op.f("ix_ai_chat_messages_group_id"), "ai_chat_messages", ["group_id"])
    op.create_index(op.f("ix_ai_chat_messages_lab_id"), "ai_chat_messages", ["lab_id"])
    op.create_index(op.f("ix_ai_chat_messages_role"), "ai_chat_messages", ["role"])


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_chat_messages_role"), table_name="ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_messages_lab_id"), table_name="ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_messages_group_id"), table_name="ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_messages_user_id"), table_name="ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_messages_thread_id"), table_name="ai_chat_messages")
    op.drop_table("ai_chat_messages")
