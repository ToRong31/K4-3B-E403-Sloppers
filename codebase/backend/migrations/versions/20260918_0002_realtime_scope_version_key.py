"""scope realtime event versions by workspace

Revision ID: 20260918_0002
Revises: 21842b040a52
Create Date: 2026-09-18
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260918_0002"
down_revision: str | None = "21842b040a52"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "realtime_events_entity_id_version_key",
        "realtime_events",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_realtime_events_scope_entity_version",
        "realtime_events",
        ["scope_id", "entity_id", "version"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_realtime_events_scope_entity_version",
        "realtime_events",
        type_="unique",
    )
    op.create_unique_constraint(
        "realtime_events_entity_id_version_key",
        "realtime_events",
        ["entity_id", "version"],
    )
