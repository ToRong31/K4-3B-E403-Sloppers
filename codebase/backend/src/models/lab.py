from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class LabSourceType(StrEnum):
    REQUIREMENT = "requirement"
    GUIDE = "guide"
    DELIVERABLE = "deliverable"
    RUBRIC = "rubric"
    ATTACHMENT = "attachment"


class LabItem(BaseModel):
    item_id: str = Field(min_length=1, max_length=100)
    item_order: int = Field(ge=1)
    source_type: LabSourceType
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    ref_id: str = Field(min_length=1, max_length=300)
    is_required: bool = True


class LabCheckpoint(BaseModel):
    checkpoint_id: str = Field(min_length=1, max_length=100)
    checkpoint_order: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=200)
    due_at: datetime | None = None
    items: list[LabItem] = Field(default_factory=list)


class LabManifest(BaseModel):
    lab_id: str = Field(min_length=1, max_length=100)
    version: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=200)
    checkpoints: list[LabCheckpoint] = Field(min_length=1)
