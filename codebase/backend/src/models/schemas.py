from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator


class DraftStatus(StrEnum):
    READY = "ready"
    CLARIFY = "clarify"


class AssignmentConfidence(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MemberInput(BaseModel):
    # IDs come from the group service.  Keep them opaque here so the assignment
    # operation also works with the frontend's existing string fixture IDs.
    id: str = Field(default_factory=lambda: str(uuid4()), min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    skills: list[str] = Field(default_factory=list, max_length=10)


class CanonicalTaskInput(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()), min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    deliverable: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=1000)
    required_skills: list[str] = Field(default_factory=list, max_length=20)
    checkpoint_id: str | None = Field(default=None, max_length=100)
    depends_on: list[str] = Field(default_factory=list, max_length=50)
    estimated_effort: str | None = Field(default=None, max_length=20)


class AssignmentDraftRequest(BaseModel):
    group_name: str = Field(min_length=1, max_length=100)
    members: list[MemberInput] = Field(min_length=1, max_length=10)
    tasks: list[CanonicalTaskInput] = Field(default_factory=list, max_length=50)
    lab_id: str | None = Field(default=None, min_length=1, max_length=200)
    version: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def require_one_task_source(self) -> "AssignmentDraftRequest":
        if bool(self.tasks) == bool(self.lab_id):
            raise ValueError("Cung cấp đúng một nguồn task: tasks hoặc lab_id/version.")
        return self


class AssignmentItem(BaseModel):
    task_id: str
    owner_id: str
    matched_skills: list[str] = Field(default_factory=list)
    reason: str = Field(min_length=1, max_length=300)
    confidence: AssignmentConfidence


class AssignmentDraftResponse(BaseModel):
    status: DraftStatus
    assignments: list[AssignmentItem] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


class TaskAnalysisRequest(BaseModel):
    lab_id: str | None = None
    version: int = Field(default=1, ge=1)
    lab_manifest: dict[str, Any] | None = None
    documents: list[dict[str, Any]] = Field(default_factory=list, max_length=100)


class TaskAnalysisResponse(BaseModel):
    status: DraftStatus
    checklist_draft: dict[str, Any] | None = None
    # Kept alongside checklist_draft for the live evaluation contract.
    checklist: dict[str, Any] | None = None
    gaps: list[str] = Field(default_factory=list)
    questions: list[str] = Field(default_factory=list)
    error: str | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
