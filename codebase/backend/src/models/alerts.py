from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AlertSeverity(StrEnum):
    WARNING = "warning"
    CRITICAL = "critical"


class CoachAlert(BaseModel):
    alert_id: UUID = Field(default_factory=uuid4)
    group_id: UUID
    checkpoint_id: str
    fingerprint: str = Field(min_length=1)
    severity: AlertSeverity
    reason: str
    incomplete_task_ids: list[UUID]
    first_detected_at: datetime
    last_detected_at: datetime
    status: str = "open"
