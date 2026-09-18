from datetime import UTC, datetime
from uuid import UUID

from src.infrastructure.database.models import HelpReplyRecord, HelpRequestRecord, UserRecord
from src.infrastructure.database.repositories import WorkspaceRepository
from src.services.workspace import ForbiddenError, NotFoundError, event_envelope


class CoachService:
    def __init__(self, repository: WorkspaceRepository) -> None:
        self.repository = repository

    def dashboard(self, actor: UserRecord) -> dict:
        if actor.role != "coach":
            raise ForbiddenError("Chỉ Coach được xem dashboard lớp.")
        groups = self.repository.list_class_groups(actor.class_scope_id)
        rows = []
        for group in groups:
            plan = self.repository.active_plan(group.id)
            progress = plan.task_progress if plan else []
            done = sum(item.status == "done" for item in progress)
            blocked = sum(item.status == "blocked" for item in progress)
            percent = round(done * 100 / len(progress)) if progress else 0
            pending_help = any(
                item.status == "pending"
                for item in self.repository.list_help_requests(group_id=group.id)
            )
            rows.append(
                {
                    "id": str(group.id),
                    "name": group.name,
                    "code": group.code,
                    "progress": percent,
                    "blocked": blocked,
                    "lastCheckIn": group.last_check_in_at.isoformat()
                    if group.last_check_in_at
                    else None,
                    "help": "pending" if pending_help else None,
                }
            )
        return {
            "source": "postgres",
            "summary": {
                "activeGroups": len(rows),
                "aboveEighty": sum(row["progress"] >= 80 for row in rows),
                "blocked": sum(row["blocked"] > 0 for row in rows),
                "helpNeeded": sum(row["help"] == "pending" for row in rows),
            },
            "groups": rows,
        }

    def list_requests(self, actor: UserRecord) -> list[dict]:
        if actor.role == "coach":
            allowed = {
                group.id for group in self.repository.list_class_groups(actor.class_scope_id)
            }
            records = [
                item for item in self.repository.list_help_requests() if item.group_id in allowed
            ]
        else:
            group = self.repository.get_group_for_user(actor.id)
            if group is None:
                return []
            records = self.repository.list_help_requests(group_id=group.id)
        return [self.serialize_request(record) for record in records]

    def create_request(
        self, actor: UserRecord, *, group_id: UUID, topic: str, question: str, urgent: bool
    ) -> tuple[dict, dict]:
        membership = self.repository.get_membership(group_id, actor.id)
        if (
            membership is None
            or membership.invitation_status != "accepted"
            or actor.role == "coach"
        ):
            raise ForbiddenError("Chỉ thành viên nhóm được gửi yêu cầu hỗ trợ.")
        group = self.repository.get_group(group_id)
        record = HelpRequestRecord(
            group_id=group_id,
            sender_id=actor.id,
            topic=topic,
            question=question,
            urgent=urgent,
            status="pending",
        )
        self.repository.add(record)
        self.repository.flush()
        group.version += 1
        group.updated_by = actor.id
        payload = self.serialize_request(record)
        event = self.repository.create_event(
            event_type="help_request.created",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(record.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def reply(self, actor: UserRecord, request_id: UUID, message: str) -> tuple[dict, dict]:
        record, group = self._coach_request(actor, request_id)
        reply = HelpReplyRecord(help_request_id=record.id, author_id=actor.id, message=message)
        self.repository.add(reply)
        self.repository.flush()
        group.version += 1
        group.updated_by = actor.id
        payload = {
            "request_id": str(record.id),
            "reply": {"id": str(reply.id), "message": message, "author_id": str(actor.id)},
        }
        event = self.repository.create_event(
            event_type="help_request.replied",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(record.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def resolve(self, actor: UserRecord, request_id: UUID) -> tuple[dict, dict]:
        record, group = self._coach_request(actor, request_id)
        record.status = "resolved"
        record.resolved_by = actor.id
        record.resolved_at = datetime.now(UTC)
        group.version += 1
        group.updated_by = actor.id
        payload = {
            "request_id": str(record.id),
            "status": "resolved",
            "resolved_at": record.resolved_at.isoformat(),
        }
        event = self.repository.create_event(
            event_type="help_request.resolved",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(record.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def _coach_request(self, actor: UserRecord, request_id: UUID):
        if actor.role != "coach":
            raise ForbiddenError("Chỉ Coach được phản hồi yêu cầu.")
        record = self.repository.get_help_request(request_id)
        if record is None:
            raise NotFoundError("Không tìm thấy yêu cầu hỗ trợ.")
        group = self.repository.get_group(record.group_id)
        if group.class_scope_id != actor.class_scope_id:
            raise ForbiddenError("Yêu cầu nằm ngoài phạm vi lớp của Coach.")
        return record, group

    @staticmethod
    def serialize_request(record: HelpRequestRecord) -> dict:
        return {
            "id": str(record.id),
            "groupId": str(record.group_id),
            "senderId": str(record.sender_id),
            "topic": record.topic,
            "question": record.question,
            "urgent": record.urgent,
            "status": record.status,
            "createdAt": record.created_at.isoformat() if record.created_at else None,
            "resolvedAt": record.resolved_at.isoformat() if record.resolved_at else None,
            "replies": [
                {
                    "id": str(reply.id),
                    "authorId": str(reply.author_id),
                    "message": reply.message,
                    "createdAt": reply.created_at.isoformat() if reply.created_at else None,
                }
                for reply in getattr(record, "replies", [])
            ],
        }
