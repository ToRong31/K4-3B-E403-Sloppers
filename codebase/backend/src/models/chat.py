from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ChatRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class ChatMessage(BaseModel):
    message_id: UUID = Field(default_factory=uuid4)
    role: ChatRole
    content: str = Field(min_length=1)
    reference_ids: list[str] = Field(default_factory=list)


class PrivateChatContext(BaseModel):
    thread_id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    group_id: UUID
    lab_id: str
    active_task_id: UUID | None = None
    summary: str = ""
    recent_messages: list[ChatMessage] = Field(default_factory=list)
