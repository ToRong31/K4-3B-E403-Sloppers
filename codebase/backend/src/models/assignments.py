from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Confidence(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AssignmentDraftItem(BaseModel):
    task_id: UUID
    owner_id: UUID
    matched_skills: list[str] = Field(default_factory=list)
    reason: str = Field(min_length=1, max_length=500)
    confidence: Confidence


class AssignmentPlan(BaseModel):
    assignment_draft_id: UUID = Field(default_factory=uuid4)
    group_id: UUID
    checklist_id: UUID
    status: str = "pending_confirmation"
    assignments: list[AssignmentDraftItem] = Field(min_length=1)
    gaps: list[str] = Field(default_factory=list)
