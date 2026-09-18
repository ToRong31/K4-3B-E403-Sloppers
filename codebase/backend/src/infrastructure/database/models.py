from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class UserRecord(Base, AuditMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    student_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    short_name: Mapped[str] = mapped_column(String(60))
    role: Mapped[str] = mapped_column(String(20), index=True)
    password_hash: Mapped[str] = mapped_column(String(512))
    class_scope_id: Mapped[str] = mapped_column(String(80), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class SessionRecord(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user: Mapped[UserRecord] = relationship()


class LabRecord(Base, AuditMixin):
    __tablename__ = "labs"
    __table_args__ = (UniqueConstraint("slug", "checklist_version"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(160), index=True)
    title: Mapped[str] = mapped_column(String(255))
    checklist_version: Mapped[int] = mapped_column(Integer, default=1)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    canonical_tasks: Mapped[list[CanonicalTaskRecord]] = relationship(
        back_populates="lab",
        cascade="all, delete-orphan",
        order_by="CanonicalTaskRecord.task_order",
    )


class CanonicalTaskRecord(Base, AuditMixin):
    __tablename__ = "canonical_tasks"
    __table_args__ = (UniqueConstraint("lab_id", "task_key"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    lab_id: Mapped[UUID] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"), index=True)
    task_key: Mapped[str] = mapped_column(String(100))
    checkpoint_id: Mapped[str] = mapped_column(String(100))
    task_order: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String(60))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    deliverable: Mapped[str] = mapped_column(String(500))
    completion_criteria: Mapped[list[str]] = mapped_column(JSON, default=list)
    required_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    depends_on: Mapped[list[str]] = mapped_column(JSON, default=list)
    reference_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    lab: Mapped[LabRecord] = relationship(back_populates="canonical_tasks")


class GroupRecord(Base, AuditMixin):
    __tablename__ = "groups"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    lab_id: Mapped[UUID] = mapped_column(ForeignKey("labs.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    leader_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    class_scope_id: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    version: Mapped[int] = mapped_column(Integer, default=0)
    last_check_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    updated_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    lab: Mapped[LabRecord] = relationship()
    members: Mapped[list[GroupMemberRecord]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )


class GroupMemberRecord(Base, AuditMixin):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    membership_role: Mapped[str] = mapped_column(String(20), default="member")
    invitation_status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    profile_status: Mapped[str] = mapped_column(String(20), default="pending")
    invited_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    group: Mapped[GroupRecord] = relationship(back_populates="members")
    user: Mapped[UserRecord] = relationship(foreign_keys=[user_id])
    skill_profile: Mapped[SkillProfileRecord | None] = relationship(
        back_populates="membership", cascade="all, delete-orphan", uselist=False
    )


class SkillProfileRecord(Base, AuditMixin):
    __tablename__ = "skill_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    membership_id: Mapped[UUID] = mapped_column(
        ForeignKey("group_members.id", ondelete="CASCADE"), unique=True, index=True
    )
    industry: Mapped[str | None] = mapped_column(String(100))
    skills: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    updated_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    membership: Mapped[GroupMemberRecord] = relationship(back_populates="skill_profile")


class AssignmentDraftRecord(Base, AuditMixin):
    __tablename__ = "assignment_drafts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    group_name: Mapped[str | None] = mapped_column(String(100), index=True)
    group_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), index=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(30), index=True)
    gaps: Mapped[list[str]] = mapped_column(JSON, default=list)
    model_meta: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    request_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    result_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    items: Mapped[list[AssignmentItemRecord]] = relationship(
        back_populates="draft", cascade="all, delete-orphan"
    )


class AssignmentItemRecord(Base, AuditMixin):
    __tablename__ = "assignment_items"
    __table_args__ = (UniqueConstraint("draft_id", "task_id"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    draft_id: Mapped[UUID] = mapped_column(
        ForeignKey("assignment_drafts.id", ondelete="CASCADE"), index=True
    )
    task_id: Mapped[UUID] = mapped_column(ForeignKey("canonical_tasks.id"), index=True)
    proposed_owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    approved_owner_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(20))
    matched_skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    overridden: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    draft: Mapped[AssignmentDraftRecord] = relationship(back_populates="items")


class ApprovedPlanRecord(Base, AuditMixin):
    __tablename__ = "approved_plans"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    draft_id: Mapped[UUID] = mapped_column(ForeignKey("assignment_drafts.id"), unique=True)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="active")
    approved_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    task_progress: Mapped[list[TaskProgressRecord]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )


class TaskProgressRecord(Base, AuditMixin):
    __tablename__ = "task_progress"
    __table_args__ = (UniqueConstraint("plan_id", "task_id"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    plan_id: Mapped[UUID] = mapped_column(
        ForeignKey("approved_plans.id", ondelete="CASCADE"), index=True
    )
    task_id: Mapped[UUID] = mapped_column(ForeignKey("canonical_tasks.id"), index=True)
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="todo")
    blocked_reason: Mapped[str | None] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    plan: Mapped[ApprovedPlanRecord] = relationship(back_populates="task_progress")


class HelpRequestRecord(Base, AuditMixin):
    __tablename__ = "help_requests"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    group_id: Mapped[UUID] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    topic: Mapped[str] = mapped_column(String(200))
    question: Mapped[str] = mapped_column(Text)
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    resolved_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replies: Mapped[list[HelpReplyRecord]] = relationship(
        back_populates="help_request", cascade="all, delete-orphan"
    )


class HelpReplyRecord(Base, AuditMixin):
    __tablename__ = "help_replies"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    help_request_id: Mapped[UUID] = mapped_column(
        ForeignKey("help_requests.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    message: Mapped[str] = mapped_column(Text)
    help_request: Mapped[HelpRequestRecord] = relationship(back_populates="replies")


class RealtimeEventRecord(Base):
    __tablename__ = "realtime_events"
    __table_args__ = (
        UniqueConstraint(
            "scope_id",
            "entity_id",
            "version",
            name="uq_realtime_events_scope_entity_version",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(80), index=True)
    scope_type: Mapped[str] = mapped_column(String(20), index=True)
    scope_id: Mapped[str] = mapped_column(String(100), index=True)
    entity_id: Mapped[str] = mapped_column(String(100), index=True)
    version: Mapped[int] = mapped_column(Integer)
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    actor_role: Mapped[str] = mapped_column(String(20))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
