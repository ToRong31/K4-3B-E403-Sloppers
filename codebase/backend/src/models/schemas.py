from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class DraftStatus(StrEnum):
    READY = "ready"
    CLARIFY = "clarify"


class MemberInput(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str = Field(min_length=1, max_length=100)
    skills: list[str] = Field(default_factory=list, max_length=10)


class CanonicalTaskInput(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str = Field(min_length=1, max_length=200)
    deliverable: str = Field(min_length=1, max_length=300)


class AssignmentDraftRequest(BaseModel):
    group_name: str = Field(min_length=1, max_length=100)
    members: list[MemberInput] = Field(min_length=1, max_length=10)
    tasks: list[CanonicalTaskInput] = Field(min_length=1, max_length=50)


class AssignmentItem(BaseModel):
    task_id: UUID
    owner_id: UUID
    reason: str = Field(min_length=1, max_length=300)


class AssignmentDraftResponse(BaseModel):
    status: DraftStatus
    assignments: list[AssignmentItem] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str


class ReadinessResponse(BaseModel):
    status: str
    database: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    user_id: str = Field(default="member-1")
    group_id: str = Field(default="Sloppers")
    thread_id: str = Field(default="thread-1")
    lab_id: str = Field(default="K4-L3B-DAY05-06-MINI-HACKATHON")
    task_id: str | None = None
    tasks: list[dict[str, Any]] | None = None
    documents: list[dict[str, Any]] | None = None


class ChatResponse(BaseModel):
    status: str
    answer: str
    task_ids: list[str] = Field(default_factory=list)
    reference_ids: list[str] = Field(default_factory=list)
    suggested_next_action: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
