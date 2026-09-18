from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DraftStatus(StrEnum):
    READY = "ready"
    CLARIFY = "clarify"


class MemberInput(BaseModel):
    id: UUID | str = Field(default_factory=uuid4)
    name: str = Field(min_length=1, max_length=100)
    skills: list[str] = Field(default_factory=list, max_length=10)


class CanonicalTaskInput(BaseModel):
    id: UUID | str = Field(default_factory=uuid4)
    title: str = Field(min_length=1, max_length=200)
    deliverable: str = Field(min_length=1, max_length=300)


class AssignmentDraftRequest(BaseModel):
    group_name: str = Field(min_length=1, max_length=100)
    members: list[MemberInput] = Field(min_length=1, max_length=10)
    tasks: list[CanonicalTaskInput] = Field(min_length=1, max_length=50)


class AssignmentItem(BaseModel):
    task_id: UUID | str
    owner_id: UUID | str
    reason: str = Field(min_length=1, max_length=300)


class AssignmentDraftResponse(BaseModel):
    status: DraftStatus
    assignments: list[AssignmentItem] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


class TaskAnalysisRequest(BaseModel):
    lab_id: str | None = None
    lab_manifest: dict[str, Any] | None = None


class TaskAnalysisResponse(BaseModel):
    status: DraftStatus
    checklist_draft: dict[str, Any] | None = None
    gaps: list[str] = Field(default_factory=list)
    questions: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str
