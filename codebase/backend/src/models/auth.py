from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str | None = Field(default=None, max_length=255)
    account_id: str | None = Field(default=None, alias="accountId")
    password: str = Field(min_length=1, max_length=200)


class SessionUser(BaseModel):
    id: UUID
    accountId: str
    email: str
    displayName: str
    shortName: str
    role: Literal["leader", "member", "coach"]
    roleLabel: str
    avatar: str
    classScopeId: str


class SessionResponse(BaseModel):
    user: SessionUser
    expires_at: datetime | None = None
