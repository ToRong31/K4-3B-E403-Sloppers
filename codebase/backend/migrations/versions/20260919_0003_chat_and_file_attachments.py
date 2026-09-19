"""Add group chat messages and file attachments tables

Revision ID: 20260919_0003
Revises: 20260918_0002
Create Date: 2026-09-19
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260919_0003"
down_revision: str | None = "20260918_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "file_attachments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("file_url", sa.Text(), nullable=False),
        sa.Column("group_id", sa.String(length=100), nullable=True),
        sa.Column("user_id", sa.String(length=100), nullable=True),
        sa.Column("channel", sa.String(length=20), nullable=False, server_default="group"),
        sa.Column("is_image", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_file_attachments_group_id"), "file_attachments", ["group_id"])
    op.create_index(op.f("ix_file_attachments_user_id"), "file_attachments", ["user_id"])
    op.create_index(op.f("ix_file_attachments_channel"), "file_attachments", ["channel"])

    op.create_table(
        "group_chat_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.String(length=100), nullable=False),
        sa.Column("group_id", sa.String(length=100), nullable=False),
        sa.Column("sender_id", sa.String(length=100), nullable=True),
        sa.Column("sender_code", sa.String(length=40), nullable=True),
        sa.Column("author", sa.String(length=120), nullable=False),
        sa.Column("short_name", sa.String(length=60), nullable=True),
        sa.Column("initial", sa.String(length=10), nullable=True),
        sa.Column("role", sa.String(length=40), nullable=True),
        sa.Column("is_leader", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("time_label", sa.String(length=40), nullable=True),
        sa.Column("text", sa.Text(), nullable=False, server_default=""),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("file_size", sa.String(length=50), nullable=True),
        sa.Column("file_type", sa.String(length=100), nullable=True),
        sa.Column("file_data", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_group_chat_messages_client_id"), "group_chat_messages", ["client_id"], unique=True)
    op.create_index(op.f("ix_group_chat_messages_group_id"), "group_chat_messages", ["group_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_group_chat_messages_group_id"), table_name="group_chat_messages")
    op.drop_index(op.f("ix_group_chat_messages_client_id"), table_name="group_chat_messages")
    op.drop_table("group_chat_messages")

    op.drop_index(op.f("ix_file_attachments_channel"), table_name="file_attachments")
    op.drop_index(op.f("ix_file_attachments_user_id"), table_name="file_attachments")
    op.drop_index(op.f("ix_file_attachments_group_id"), table_name="file_attachments")
    op.drop_table("file_attachments")
