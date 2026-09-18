from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class TaskStatus(StrEnum):
    PROPOSED = "proposed"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"


class EffortSize(StrEnum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class TaskDraft(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    task_key: str = Field(min_length=1, max_length=100)
    checkpoint_id: str = Field(min_length=1, max_length=100)
    task_order: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=1000)
    deliverable: str = Field(min_length=1, max_length=500)
    completion_criteria: list[str] = Field(min_length=1)
    required_skills: list[str] = Field(default_factory=list)
    estimated_effort: EffortSize
    depends_on: list[str] = Field(default_factory=list)
    reference_ids: list[str] = Field(min_length=1)
    status: TaskStatus = TaskStatus.PROPOSED


class CheckpointChecklist(BaseModel):
    checkpoint_id: str
    checkpoint_order: int = Field(ge=1)
    tasks: list[TaskDraft] = Field(default_factory=list)


class ChecklistDraft(BaseModel):
    checklist_id: UUID = Field(default_factory=uuid4)
    lab_id: str
    lab_version: int = Field(ge=1)
    status: str = "pending_review"
    checkpoints: list[CheckpointChecklist] = Field(min_length=1)
