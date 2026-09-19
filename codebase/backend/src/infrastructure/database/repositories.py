from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session, selectinload

from src.infrastructure.database.models import (
    AIChatMessageRecord,
    ApprovedPlanRecord,
    AssignmentDraftRecord,
    CanonicalTaskRecord,
    FileAttachmentRecord,
    GroupChatMessageRecord,
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

    def save_file_attachment(
        self,
        *,
        filename: str,
        content_type: str,
        file_url: str,
        size_bytes: int = 0,
        group_id: str | None = None,
        user_id: str | None = None,
        channel: str = "group",
        is_image: bool = False,
    ) -> FileAttachmentRecord:
        record = FileAttachmentRecord(
            filename=filename,
            content_type=content_type,
            size_bytes=size_bytes,
            file_url=file_url,
            group_id=group_id,
            user_id=user_id,
            channel=channel,
            is_image=is_image,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    def list_file_attachments(
        self, *, group_id: str | None = None, channel: str | None = None
    ) -> list[FileAttachmentRecord]:
        query = select(FileAttachmentRecord)
        if group_id:
            query = query.where(FileAttachmentRecord.group_id == group_id)
        if channel:
            query = query.where(FileAttachmentRecord.channel == channel)
        return list(self.session.scalars(query.order_by(FileAttachmentRecord.created_at.desc())))

    def save_group_chat_message(self, message: dict[str, Any]) -> GroupChatMessageRecord:
        client_id = str(message.get("id") or f"msg-{int(datetime.now(UTC).timestamp() * 1000)}")
        existing = self.session.scalar(
            select(GroupChatMessageRecord).where(GroupChatMessageRecord.client_id == client_id)
        )
        if existing:
            return existing

        image_data = message.get("image")
        file_obj = message.get("file")
        file_name = file_obj.get("name") if isinstance(file_obj, dict) else None
        file_size = file_obj.get("size") if isinstance(file_obj, dict) else None
        file_type = file_obj.get("type") if isinstance(file_obj, dict) else None
        file_data = file_obj.get("dataUrl") if isinstance(file_obj, dict) else None

        # Also store to file_attachments table for persistent asset retrieval
        if file_name and file_data:
            attachment = FileAttachmentRecord(
                filename=file_name,
                content_type=file_type or "application/octet-stream",
                file_url=file_data,
                group_id=str(message.get("groupId") or ""),
                user_id=str(message.get("senderId") or ""),
                channel="group",
                is_image=False,
            )
            self.session.add(attachment)

        if image_data:
            attachment = FileAttachmentRecord(
                filename=f"image_{client_id}.png",
                content_type="image/png",
                file_url=image_data,
                group_id=str(message.get("groupId") or ""),
                user_id=str(message.get("senderId") or ""),
                channel="group",
                is_image=True,
            )
            self.session.add(attachment)

        record = GroupChatMessageRecord(
            client_id=client_id,
            group_id=str(message.get("groupId") or "group-sloppers"),
            sender_id=str(message.get("senderId") or ""),
            sender_code=message.get("senderCode"),
            author=str(message.get("author") or "Thành viên"),
            short_name=message.get("shortName"),
            initial=message.get("initial"),
            role=message.get("role"),
            is_leader=bool(message.get("isLeader")),
            time_label=message.get("time"),
            text=str(message.get("text") or ""),
            image_url=image_data,
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
            file_data=file_data,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    def list_group_chat_messages(
        self, group_id: str | None = None, group_ids: list[str] | set[str] | None = None
    ) -> list[dict[str, Any]]:
        target_ids: set[str] = set()
        if group_id:
            target_ids.add(str(group_id))
        if group_ids:
            target_ids.update(str(g) for g in group_ids)

        query = select(GroupChatMessageRecord)
        if target_ids:
            query = query.where(GroupChatMessageRecord.group_id.in_(target_ids))
        records = list(
            self.session.scalars(query.order_by(GroupChatMessageRecord.created_at.asc()))
        )
        result = []
        for r in records:
            item: dict[str, Any] = {
                "id": r.client_id,
                "groupId": r.group_id,
                "senderId": r.sender_id,
                "senderCode": r.sender_code,
                "author": r.author,
                "shortName": r.short_name,
                "initial": r.initial,
                "role": r.role,
                "isLeader": r.is_leader,
                "time": r.time_label,
                "text": r.text,
            }
            if r.image_url:
                item["image"] = r.image_url
            if r.file_name:
                item["file"] = {
                    "name": r.file_name,
                    "size": r.file_size,
                    "type": r.file_type,
                    "dataUrl": r.file_data,
                }
            result.append(item)
        return result

    def save_ai_chat_message(
        self,
        *,
        thread_id: str,
        role: str,
        content: str,
        user_id: str | None = None,
        group_id: str | None = None,
        lab_id: str | None = None,
        status: str | None = None,
        suggested_next_action: str | None = None,
        task_ids: list[str] | None = None,
        reference_ids: list[str] | None = None,
        image_url: str | None = None,
        file_name: str | None = None,
        file_size: str | None = None,
        file_type: str | None = None,
        file_data: str | None = None,
    ) -> AIChatMessageRecord:
        record = AIChatMessageRecord(
            thread_id=thread_id,
            user_id=user_id,
            group_id=group_id,
            lab_id=lab_id,
            role=role,
            content=content,
            status=status,
            suggested_next_action=suggested_next_action,
            task_ids=task_ids or [],
            reference_ids=reference_ids or [],
            image_url=image_url,
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
            file_data=file_data,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    def list_ai_chat_messages(
        self,
        *,
        thread_id: str | None = None,
        user_id: str | None = None,
        group_id: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        query = select(AIChatMessageRecord)
        if thread_id:
            query = query.where(AIChatMessageRecord.thread_id == thread_id)
        elif user_id and group_id:
            query = query.where(
                or_(
                    AIChatMessageRecord.thread_id == f"{group_id}:{user_id}",
                    (AIChatMessageRecord.user_id == user_id) & (AIChatMessageRecord.group_id == group_id),
                )
            )
        elif user_id:
            query = query.where(AIChatMessageRecord.user_id == user_id)
        elif group_id:
            query = query.where(AIChatMessageRecord.group_id == group_id)

        query = query.order_by(AIChatMessageRecord.created_at.asc()).limit(limit)
        records = list(self.session.scalars(query))

        result = []
        for r in records:
            item: dict[str, Any] = {
                "id": str(r.id),
                "role": r.role,
                "answer": r.content,
                "status": r.status,
                "reference_ids": r.reference_ids or [],
                "task_ids": r.task_ids or [],
                "suggested_next_action": r.suggested_next_action,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            if r.image_url:
                item["image"] = r.image_url
            if r.file_name:
                item["file"] = {
                    "name": r.file_name,
                    "size": r.file_size,
                    "type": r.file_type,
                    "dataUrl": r.file_data,
                }
            result.append(item)
        return result

    def clear_ai_chat_messages(
        self,
        *,
        thread_id: str | None = None,
        user_id: str | None = None,
        group_id: str | None = None,
    ) -> int:
        query = delete(AIChatMessageRecord)
        if thread_id:
            query = query.where(AIChatMessageRecord.thread_id == thread_id)
        elif user_id and group_id:
            query = query.where(
                or_(
                    AIChatMessageRecord.thread_id == f"{group_id}:{user_id}",
                    (AIChatMessageRecord.user_id == user_id) & (AIChatMessageRecord.group_id == group_id),
                )
            )
        elif user_id:
            query = query.where(AIChatMessageRecord.user_id == user_id)
        elif group_id:
            query = query.where(AIChatMessageRecord.group_id == group_id)
        else:
            return 0

        res = self.session.execute(query)
        self.session.commit()
        return res.rowcount


