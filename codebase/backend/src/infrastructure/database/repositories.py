from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from src.infrastructure.database.models import (
    ApprovedPlanRecord,
    AssignmentDraftRecord,
    CanonicalTaskRecord,
    GroupMemberRecord,
    GroupRecord,
    HelpRequestRecord,
    LabRecord,
    RealtimeEventRecord,
    SessionRecord,
    TaskProgressRecord,
    UserRecord,
)


class AssignmentDraftRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def save(
        self,
        *,
        group_name: str,
        status: str,
        request_payload: dict[str, Any],
        result_payload: dict[str, Any],
    ) -> UUID:
        record = AssignmentDraftRecord(
            group_name=group_name,
            status=status,
            request_payload=request_payload,
            result_payload=result_payload,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record.id


class AuthRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def find_active_user(self, identity: str) -> UserRecord | None:
        normalized = identity.strip().lower()
        return self.session.scalar(
            select(UserRecord).where(
                UserRecord.active.is_(True),
                or_(
                    func.lower(UserRecord.email) == normalized,
                    func.lower(UserRecord.student_code) == normalized,
                ),
            )
        )

    def create_session(self, session_record: SessionRecord) -> None:
        self.session.add(session_record)
        self.session.commit()

    def get_session(self, token_hash: str) -> SessionRecord | None:
        return self.session.scalar(
            select(SessionRecord)
            .options(selectinload(SessionRecord.user))
            .where(SessionRecord.token_hash == token_hash)
        )

    def revoke(self, token_hash: str) -> None:
        record = self.get_session(token_hash)
        if record and record.revoked_at is None:
            record.revoked_at = datetime.now(UTC)
            self.session.commit()


class WorkspaceRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def commit(self) -> None:
        self.session.commit()

    def add(self, record: Any) -> None:
        self.session.add(record)

    def flush(self) -> None:
        self.session.flush()

    def get_lab(self, slug: str, version: int = 1) -> LabRecord | None:
        return self.session.scalar(
            select(LabRecord)
            .options(selectinload(LabRecord.canonical_tasks))
            .where(
                LabRecord.slug == slug,
                LabRecord.checklist_version == version,
                LabRecord.active.is_(True),
            )
        )

    def get_user(self, user_id: UUID) -> UserRecord | None:
        return self.session.get(UserRecord, user_id)

    def get_user_by_code(self, student_code: str) -> UserRecord | None:
        return self.session.scalar(
            select(UserRecord).where(UserRecord.student_code == student_code)
        )

    def list_class_members(self, class_scope_id: str) -> list[UserRecord]:
        return list(
            self.session.scalars(
                select(UserRecord)
                .where(
                    UserRecord.class_scope_id == class_scope_id,
                    UserRecord.role == "member",
                    UserRecord.active.is_(True),
                )
                .order_by(UserRecord.display_name)
            )
        )

    def get_group(self, group_id: UUID) -> GroupRecord | None:
        return self.session.scalar(
            select(GroupRecord)
            .options(
                selectinload(GroupRecord.lab).selectinload(LabRecord.canonical_tasks),
                selectinload(GroupRecord.members).selectinload(GroupMemberRecord.user),
                selectinload(GroupRecord.members).selectinload(GroupMemberRecord.skill_profile),
            )
            .where(GroupRecord.id == group_id)
        )

    def get_group_by_code(self, code: str) -> GroupRecord | None:
        return self.session.scalar(select(GroupRecord).where(GroupRecord.code == code))

    def get_group_for_user(self, user_id: UUID) -> GroupRecord | None:
        group_id = self.session.scalar(
            select(GroupMemberRecord.group_id)
            .where(GroupMemberRecord.user_id == user_id)
            .order_by(GroupMemberRecord.created_at.desc())
            .limit(1)
        )
        return self.get_group(group_id) if group_id else None

    def get_membership(self, group_id: UUID, user_id: UUID) -> GroupMemberRecord | None:
        return self.session.scalar(
            select(GroupMemberRecord)
            .options(
                selectinload(GroupMemberRecord.user), selectinload(GroupMemberRecord.skill_profile)
            )
            .where(GroupMemberRecord.group_id == group_id, GroupMemberRecord.user_id == user_id)
        )

    def get_membership_by_id(self, membership_id: UUID) -> GroupMemberRecord | None:
        return self.session.scalar(
            select(GroupMemberRecord)
            .options(selectinload(GroupMemberRecord.user), selectinload(GroupMemberRecord.group))
            .where(GroupMemberRecord.id == membership_id)
        )

    def latest_draft(self, group_id: UUID) -> AssignmentDraftRecord | None:
        return self.session.scalar(
            select(AssignmentDraftRecord)
            .options(selectinload(AssignmentDraftRecord.items))
            .where(AssignmentDraftRecord.group_id == group_id)
            .order_by(AssignmentDraftRecord.version.desc())
            .limit(1)
        )

    def get_draft(self, draft_id: UUID) -> AssignmentDraftRecord | None:
        return self.session.scalar(
            select(AssignmentDraftRecord)
            .options(selectinload(AssignmentDraftRecord.items))
            .where(AssignmentDraftRecord.id == draft_id)
        )

    def active_plan(self, group_id: UUID) -> ApprovedPlanRecord | None:
        return self.session.scalar(
            select(ApprovedPlanRecord)
            .options(selectinload(ApprovedPlanRecord.task_progress))
            .where(ApprovedPlanRecord.group_id == group_id, ApprovedPlanRecord.status == "active")
            .order_by(ApprovedPlanRecord.revision.desc())
            .limit(1)
        )

    def get_progress(self, plan_id: UUID, task_id: UUID) -> TaskProgressRecord | None:
        return self.session.scalar(
            select(TaskProgressRecord).where(
                TaskProgressRecord.plan_id == plan_id, TaskProgressRecord.task_id == task_id
            )
        )

    def get_task(self, task_id: UUID) -> CanonicalTaskRecord | None:
        return self.session.get(CanonicalTaskRecord, task_id)

    def create_event(
        self,
        *,
        event_type: str,
        scope_type: str,
        scope_id: str,
        entity_id: str,
        version: int,
        actor: UserRecord,
        payload: dict[str, Any],
    ) -> RealtimeEventRecord:
        event = RealtimeEventRecord(
            event_type=event_type,
            scope_type=scope_type,
            scope_id=scope_id,
            entity_id=entity_id,
            version=version,
            actor_id=actor.id,
            actor_role=actor.role,
            payload=payload,
        )
        self.session.add(event)
        return event

    def events_after(
        self, scope_ids: set[str], after: datetime | None = None
    ) -> list[RealtimeEventRecord]:
        query = select(RealtimeEventRecord).where(RealtimeEventRecord.scope_id.in_(scope_ids))
        if after:
            query = query.where(RealtimeEventRecord.occurred_at > after)
        return list(
            self.session.scalars(
                query.order_by(RealtimeEventRecord.occurred_at, RealtimeEventRecord.id)
            )
        )

    def list_class_groups(self, class_scope_id: str) -> list[GroupRecord]:
        return list(
            self.session.scalars(
                select(GroupRecord)
                .options(selectinload(GroupRecord.members), selectinload(GroupRecord.lab))
                .where(GroupRecord.class_scope_id == class_scope_id)
                .order_by(GroupRecord.created_at)
            )
        )

    def list_help_requests(self, *, group_id: UUID | None = None) -> list[HelpRequestRecord]:
        query = select(HelpRequestRecord)
        if group_id:
            query = query.where(HelpRequestRecord.group_id == group_id)
        return list(self.session.scalars(query.order_by(HelpRequestRecord.created_at.desc())))

    def get_help_request(self, request_id: UUID) -> HelpRequestRecord | None:
        return self.session.scalar(
            select(HelpRequestRecord)
            .options(selectinload(HelpRequestRecord.replies))
            .where(HelpRequestRecord.id == request_id)
        )
