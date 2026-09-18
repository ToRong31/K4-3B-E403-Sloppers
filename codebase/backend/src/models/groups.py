from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class SkillSource(StrEnum):
    SELF_DECLARED = "self_declared"


class MemberSkill(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    source: SkillSource = SkillSource.SELF_DECLARED


class GroupMember(BaseModel):
    member_id: UUID = Field(default_factory=uuid4)
    name: str = Field(min_length=1, max_length=100)
    skills: list[MemberSkill] = Field(default_factory=list, max_length=10)
    available_effort: int = Field(default=3, ge=1, le=5)


class GroupSnapshot(BaseModel):
    group_id: UUID = Field(default_factory=uuid4)
    lab_id: str
    lab_session_id: str
    name: str = Field(min_length=1, max_length=100)
    members: list[GroupMember] = Field(min_length=1, max_length=10)
