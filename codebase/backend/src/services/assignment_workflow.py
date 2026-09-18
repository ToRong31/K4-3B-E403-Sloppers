from typing import Any
from uuid import UUID

from src.infrastructure.database.models import (
    AssignmentDraftRecord,
    AssignmentItemRecord,
    UserRecord,
)
from src.infrastructure.database.repositories import WorkspaceRepository
from src.models.schemas import AssignmentDraftResponse
from src.services.workspace import ConflictError, ForbiddenError, NotFoundError, event_envelope


class AssignmentWorkflowService:
    def __init__(self, repository: WorkspaceRepository, graph: Any) -> None:
        self.repository = repository
        self.graph = graph

    def create(self, group_id: UUID, actor: UserRecord) -> tuple[dict, dict]:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        if actor.role != "leader" or group.leader_id != actor.id:
            raise ForbiddenError("Chỉ nhóm trưởng được tạo bản nháp phân công.")
        accepted = [member for member in group.members if member.invitation_status == "accepted"]
        pending = [
            member.user.short_name
            for member in group.members
            if member.invitation_status == "pending"
        ]
        missing = [
            member.user.short_name for member in accepted if member.profile_status != "completed"
        ]
        if pending or missing:
            gaps = []
            if pending:
                gaps.append(f"Các thành viên chưa phản hồi lời mời: {', '.join(pending)}")
            if missing:
                gaps.append(f"Các thành viên chưa hoàn tất profile: {', '.join(missing)}")
            result = AssignmentDraftResponse(status="clarify", gaps=gaps)
        else:
            result = AssignmentDraftResponse.model_validate(
                self.graph.invoke(
                    {
                        "operation": "assign_tasks",
                        "use_llm": True,
                        "group_name": group.name,
                        "members": [
                            {
                                "id": str(member.user_id),
                                "name": member.user.short_name,
                                "skills": [
                                    item["name"]
                                    for item in (
                                        member.skill_profile.skills if member.skill_profile else []
                                    )
                                ],
                            }
                            for member in accepted
                        ],
                        "tasks": [
                            {
                                "id": str(task.id),
                                "title": task.title,
                                "description": task.description,
                                "deliverable": task.deliverable,
                                "required_skills": task.required_skills,
                                "checkpoint_id": task.checkpoint_id,
                                "depends_on": task.depends_on,
                            }
                            for task in group.lab.canonical_tasks
                        ],
                    }
                )
            )
        previous = self.repository.latest_draft(group_id)
        draft = AssignmentDraftRecord(
            group_id=group_id,
            group_name=group.name,
            version=(previous.version + 1) if previous else 1,
            status=result.status.value,
            gaps=result.gaps,
            model_meta={},
            request_payload=None,
            result_payload=result.model_dump(mode="json"),
            created_by=actor.id,
        )
        self.repository.add(draft)
        self.repository.flush()
        accepted_ids = {member.user_id for member in accepted}
        task_ids = {task.id for task in group.lab.canonical_tasks}
        for item in result.assignments:
            task_id = UUID(item.task_id)
            owner_id = UUID(item.owner_id)
            if task_id not in task_ids or owner_id not in accepted_ids:
                raise ConflictError(
                    "AI trả owner/task nằm ngoài phạm vi nhóm hoặc checklist canonical."
                )
            self.repository.add(
                AssignmentItemRecord(
                    draft_id=draft.id,
                    task_id=task_id,
                    proposed_owner_id=owner_id,
                    reason=item.reason,
                    confidence=item.confidence.value,
                    matched_skills=item.matched_skills,
                )
            )
        group.version += 1
        group.updated_by = actor.id
        payload = self.serialize(draft, result)
        event = self.repository.create_event(
            event_type="assignment_draft.created",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def override(
        self, draft_id: UUID, task_id: UUID, owner_id: UUID, actor: UserRecord
    ) -> tuple[dict, dict]:
        draft = self.repository.get_draft(draft_id)
        if draft is None or draft.group_id is None:
            raise NotFoundError("Không tìm thấy bản nháp.")
        group = self.repository.get_group(draft.group_id)
        if actor.role != "leader" or group.leader_id != actor.id:
            raise ForbiddenError("Chỉ nhóm trưởng được override owner.")
        if draft.status != "ready":
            raise ConflictError("Chỉ bản nháp READY mới có thể chỉnh sửa.")
        member = self.repository.get_membership(group.id, owner_id)
        if member is None or member.invitation_status != "accepted":
            raise ConflictError("Owner mới không phải thành viên đã xác nhận của nhóm.")
        item = next((candidate for candidate in draft.items if candidate.task_id == task_id), None)
        if item is None:
            raise NotFoundError("Task không thuộc bản nháp.")
        item.approved_owner_id = owner_id
        item.overridden = owner_id != item.proposed_owner_id
        item.updated_by = actor.id
        group.version += 1
        group.updated_by = actor.id
        payload = {
            "draft_id": str(draft.id),
            "task_id": str(task_id),
            "approved_owner_id": str(owner_id),
            "overridden": item.overridden,
        }
        event = self.repository.create_event(
            event_type="assignment_draft.overridden",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    @staticmethod
    def serialize(draft: AssignmentDraftRecord, result: AssignmentDraftResponse) -> dict:
        return {
            "id": str(draft.id),
            "group_id": str(draft.group_id),
            "version": draft.version,
            "status": result.status.value,
            "assignments": [item.model_dump(mode="json") for item in result.assignments],
            "gaps": result.gaps,
        }
