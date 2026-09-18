from datetime import UTC, datetime
from uuid import UUID

from src.infrastructure.database.models import (
    ApprovedPlanRecord,
    GroupMemberRecord,
    GroupRecord,
    SkillProfileRecord,
    TaskProgressRecord,
    UserRecord,
)
from src.infrastructure.database.repositories import WorkspaceRepository


class DomainError(Exception):
    status_code = 400


class NotFoundError(DomainError):
    status_code = 404


class ForbiddenError(DomainError):
    status_code = 403


class ConflictError(DomainError):
    status_code = 409


def event_envelope(event) -> dict:
    return {
        "event_id": str(event.id),
        "type": event.event_type,
        "scope_id": event.scope_id,
        "entity_id": event.entity_id,
        "version": event.version,
        "occurred_at": event.occurred_at.isoformat()
        if event.occurred_at
        else datetime.now(UTC).isoformat(),
        "actor": {"id": str(event.actor_id), "role": event.actor_role},
        "payload": event.payload,
    }


class WorkspaceService:
    def __init__(self, repository: WorkspaceRepository) -> None:
        self.repository = repository

    def _require_group_member(
        self, group_id: UUID, actor: UserRecord, *, accepted: bool = True
    ) -> GroupMemberRecord:
        member = self.repository.get_membership(group_id, actor.id)
        if member is None or (accepted and member.invitation_status != "accepted"):
            raise ForbiddenError("Bạn không thuộc nhóm này.")
        return member

    def _require_leader(self, group: GroupRecord, actor: UserRecord) -> None:
        if actor.role != "leader" or group.leader_id != actor.id:
            raise ForbiddenError("Chỉ nhóm trưởng của nhóm mới được thực hiện thao tác này.")

    def current_group(self, actor: UserRecord, *, accepted: bool = True) -> GroupRecord:
        group = self.repository.get_group_for_user(actor.id)
        if group is None:
            raise NotFoundError("Tài khoản chưa có nhóm LabSpace.")
        self._require_group_member(group.id, actor, accepted=accepted)
        return group

    def snapshot(self, actor: UserRecord, group_id: UUID | None = None) -> dict:
        if actor.role == "coach":
            raise ForbiddenError("Coach dùng dashboard tổng hợp thay vì workspace cá nhân.")
        group = self.repository.get_group(group_id) if group_id else self.current_group(actor, accepted=False)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        member = self._require_group_member(group.id, actor, accepted=False)
        if member.invitation_status != "accepted":
            return {
                "source": "postgres",
                "version": group.version,
                "labId": group.lab.slug,
                "group": {
                    "id": str(group.id),
                    "name": group.name,
                    "code": group.code,
                    "labId": group.lab.slug,
                },
                "checklistSource": f"{group.lab.slug} · v{group.lab.checklist_version}",
                "planStatus": "draft",
                "planId": None,
                "members": [self._member_payload(item) for item in group.members],
                "tasks": [],
            }
        plan = self.repository.active_plan(group.id)
        progress_by_task = {item.task_id: item for item in plan.task_progress} if plan else {}
        users_by_id = {member.user_id: member.user for member in group.members}
        tasks = []
        for task in group.lab.canonical_tasks:
            progress = progress_by_task.get(task.id)
            owner = users_by_id.get(progress.owner_id) if progress else None
            tasks.append(
                {
                    "id": str(task.id),
                    "task_key": task.task_key,
                    "category": task.category,
                    "title": task.title,
                    "description": task.description,
                    "deliverable": task.deliverable,
                    "required_skills": task.required_skills,
                    "checkpoint_id": task.checkpoint_id,
                    "depends_on": task.depends_on,
                    "reference_ids": task.reference_ids,
                    "owner": owner.short_name if owner else "Chưa phân công",
                    "owner_id": str(owner.id) if owner else None,
                    "status": progress.status if progress else "todo",
                    "blocked_reason": progress.blocked_reason if progress else None,
                    "version": progress.version if progress else 0,
                }
            )
        return {
            "source": "postgres",
            "version": group.version,
            "labId": group.lab.slug,
            "group": {
                "id": str(group.id),
                "name": group.name,
                "code": group.code,
                "labId": group.lab.slug,
            },
            "checklistSource": f"{group.lab.slug} · v{group.lab.checklist_version}",
            "planStatus": "approved" if plan else "draft",
            "planId": str(plan.id) if plan else None,
            "members": [self._member_payload(member) for member in group.members],
            "tasks": tasks,
        }

    @staticmethod
    def _member_payload(member: GroupMemberRecord) -> dict:
        skills = member.skill_profile.skills if member.skill_profile else []
        return {
            "id": str(member.user_id),
            "membershipId": str(member.id),
            "studentCode": member.user.student_code,
            "fullName": member.user.display_name,
            "name": member.user.short_name,
            "role": "Nhóm trưởng" if member.membership_role == "leader" else "Thành viên",
            "status": member.invitation_status,
            "profileReady": member.profile_status == "completed",
            "industry": member.skill_profile.industry if member.skill_profile else None,
            "skills": [item["name"] for item in skills],
            "skillLevels": {item["name"]: item["level"] for item in skills},
            "skillsWithLevel": [{"skill": item["name"], "level": item["level"]} for item in skills],
        }

    def create_group(
        self,
        actor: UserRecord,
        *,
        lab_slug: str,
        name: str,
        code: str,
        invitee_codes: list[str] | None = None,
    ) -> tuple[dict, list[dict]]:
        if actor.role != "leader":
            raise ForbiddenError("Chỉ tài khoản nhóm trưởng được tạo nhóm.")
        lab = self.repository.get_lab(lab_slug)
        if lab is None:
            raise NotFoundError("Không tìm thấy checklist canonical của bài Lab.")
        if self.repository.get_group_for_user(actor.id):
            raise ConflictError("Tài khoản đã có nhóm.")
        normalized_group_code = code.strip().upper()
        if self.repository.get_group_by_code(normalized_group_code):
            raise ConflictError("Mã nhóm đã tồn tại.")
        normalized_codes = list(
            dict.fromkeys(code.strip().upper() for code in (invitee_codes or []) if code.strip())
        )
        if len(normalized_codes) > 3:
            raise ConflictError("Nhóm tối đa 4 thành viên.")
        invitees = []
        for student_code in normalized_codes:
            user = self.repository.get_user_by_code(student_code)
            if user is None or not user.active:
                raise NotFoundError(f"Không tìm thấy học viên {student_code}.")
            if user.role != "member" or user.class_scope_id != actor.class_scope_id:
                raise ForbiddenError(f"Học viên {student_code} không thuộc phạm vi lớp của nhóm.")
            if self.repository.get_group_for_user(user.id):
                raise ConflictError(f"Học viên {student_code} đã thuộc một nhóm.")
            invitees.append(user)
        group = GroupRecord(
            lab_id=lab.id,
            name=name.strip(),
            code=normalized_group_code,
            leader_id=actor.id,
            class_scope_id=actor.class_scope_id,
            status="active",
            version=1,
            created_by=actor.id,
            updated_by=actor.id,
        )
        self.repository.add(group)
        self.repository.flush()
        self.repository.add(
            GroupMemberRecord(
                group_id=group.id,
                user_id=actor.id,
                membership_role="leader",
                invitation_status="accepted",
                profile_status="pending",
                invited_by=actor.id,
                responded_at=datetime.now(UTC),
            )
        )
        events = [self.repository.create_event(
            event_type="group.created",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload={"group_id": str(group.id), "name": group.name, "code": group.code},
        )]
        invitations = []
        for user in invitees:
            membership = GroupMemberRecord(
                group_id=group.id,
                user_id=user.id,
                membership_role="member",
                invitation_status="pending",
                profile_status="pending",
                invited_by=actor.id,
            )
            self.repository.add(membership)
            self.repository.flush()
            invitations.append(
                {
                    "id": str(membership.id),
                    "student_code": user.student_code,
                    "user_id": str(user.id),
                    "status": "pending",
                }
            )
        if invitations:
            group.version += 1
            events.append(
                self.repository.create_event(
                    event_type="invitation.sent",
                    scope_type="group",
                    scope_id=str(group.id),
                    entity_id=str(group.id),
                    version=group.version,
                    actor=actor,
                    payload={"invitations": invitations},
                )
            )
        self.repository.commit()
        result = {
            "id": str(group.id),
            "name": group.name,
            "code": group.code,
            "invitations": invitations,
        }
        return result, [event_envelope(event) for event in events]

    def invite(
        self, group_id: UUID, actor: UserRecord, student_codes: list[str]
    ) -> tuple[list[dict], dict]:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        self._require_leader(group, actor)
        if len(group.members) + len(student_codes) > 4:
            raise ConflictError("Nhóm tối đa 4 thành viên.")
        created = []
        existing_ids = {member.user_id for member in group.members}
        for code in dict.fromkeys(student_codes):
            user = self.repository.get_user_by_code(code)
            if user is None or not user.active:
                raise NotFoundError(f"Không tìm thấy học viên {code}.")
            if user.id == actor.id or user.id in existing_ids:
                raise ConflictError(f"Học viên {code} đã có trong nhóm.")
            if user.role != "member" or user.class_scope_id != group.class_scope_id:
                raise ForbiddenError(f"Học viên {code} không thuộc phạm vi lớp của nhóm.")
            membership = GroupMemberRecord(
                group_id=group.id,
                user_id=user.id,
                membership_role="member",
                invitation_status="pending",
                profile_status="pending",
                invited_by=actor.id,
            )
            self.repository.add(membership)
            self.repository.flush()
            existing_ids.add(user.id)
            created.append(
                {
                    "id": str(membership.id),
                    "student_code": code,
                    "user_id": str(user.id),
                    "status": "pending",
                }
            )
        group.version += 1
        group.updated_by = actor.id
        event = self.repository.create_event(
            event_type="invitation.sent",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload={"invitations": created},
        )
        self.repository.commit()
        return created, event_envelope(event)

    def update_group(
        self,
        group_id: UUID,
        actor: UserRecord,
        *,
        name: str | None,
        code: str | None,
    ) -> tuple[dict, dict | None]:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        self._require_leader(group, actor)
        next_name = name.strip() if name is not None else group.name
        next_code = code.strip().upper() if code is not None else group.code
        if len(next_name) < 1:
            raise DomainError("Tên nhóm không được để trống.")
        if len(next_code) < 4:
            raise DomainError("Mã nhóm cần ít nhất 4 ký tự.")
        existing = self.repository.get_group_by_code(next_code)
        if existing is not None and existing.id != group.id:
            raise ConflictError("Mã nhóm đã tồn tại.")
        if next_name == group.name and next_code == group.code:
            return {"id": str(group.id), "name": group.name, "code": group.code}, None
        group.name = next_name
        group.code = next_code
        group.version += 1
        group.updated_by = actor.id
        event = self.repository.create_event(
            event_type="group.updated",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload={"group_id": str(group.id), "name": group.name, "code": group.code},
        )
        self.repository.commit()
        return {"id": str(group.id), "name": group.name, "code": group.code}, event_envelope(event)

    def delete_group(self, group_id: UUID, actor: UserRecord) -> dict:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        self._require_leader(group, actor)
        event = self.repository.create_event(
            event_type="group.deleted",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version + 1,
            actor=actor,
            payload={"group_id": str(group.id), "code": group.code},
        )
        self.repository.session.delete(group)
        self.repository.commit()
        return event_envelope(event)

    def remove_member(self, group_id: UUID, user_id: UUID, actor: UserRecord) -> tuple[dict, dict]:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        self._require_leader(group, actor)
        if user_id == group.leader_id:
            raise ConflictError("Không thể xóa nhóm trưởng khỏi nhóm.")
        member = self.repository.get_membership(group_id, user_id)
        if member is None:
            raise NotFoundError("Thành viên không tồn tại trong nhóm.")
        if self.repository.active_plan(group_id) and member.invitation_status == "accepted":
            raise ConflictError("Không thể xóa thành viên sau khi kế hoạch đã được duyệt.")
        self.repository.session.delete(member)
        group.version += 1
        group.updated_by = actor.id
        payload = {"group_id": str(group.id), "user_id": str(user_id)}
        event = self.repository.create_event(
            event_type="member.removed",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(user_id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def respond_invitation(
        self, invitation_id: UUID, actor: UserRecord, decision: str
    ) -> tuple[dict, dict]:
        member = self.repository.get_membership_by_id(invitation_id)
        if member is None:
            raise NotFoundError("Không tìm thấy lời mời.")
        if member.user_id != actor.id:
            raise ForbiddenError("Bạn không thể phản hồi lời mời của người khác.")
        if member.invitation_status != "pending":
            raise ConflictError("Lời mời đã được phản hồi.")
        member.invitation_status = decision
        member.responded_at = datetime.now(UTC)
        group = member.group
        group.version += 1
        group.updated_by = actor.id
        event_type = f"invitation.{decision}"
        payload = {"invitation_id": str(member.id), "user_id": str(actor.id), "status": decision}
        event = self.repository.create_event(
            event_type=event_type,
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def save_profile(
        self, group_id: UUID, actor: UserRecord, *, industry: str | None, skills: list[dict]
    ) -> tuple[dict, dict]:
        member = self._require_group_member(group_id, actor)
        normalized = [
            {"name": item["name"].strip(), "level": int(item["level"])} for item in skills
        ]
        if not normalized:
            raise DomainError("Cần ít nhất một kỹ năng.")
        if member.skill_profile:
            member.skill_profile.industry = industry
            member.skill_profile.skills = normalized
            member.skill_profile.updated_by = actor.id
        else:
            self.repository.add(
                SkillProfileRecord(
                    membership_id=member.id,
                    industry=industry,
                    skills=normalized,
                    updated_by=actor.id,
                )
            )
        member.profile_status = "completed"
        group = self.repository.get_group(group_id)
        group.version += 1
        group.updated_by = actor.id
        payload = {"user_id": str(actor.id), "profile_status": "completed"}
        event = self.repository.create_event(
            event_type="profile.completed",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return {**payload, "skills": normalized}, event_envelope(event)

    def approve_latest_plan(self, group_id: UUID, actor: UserRecord) -> tuple[dict, dict]:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        self._require_leader(group, actor)
        if self.repository.active_plan(group_id):
            raise ConflictError("Nhóm đã có kế hoạch được duyệt.")
        draft = self.repository.latest_draft(group_id)
        if draft is None or draft.status != "ready" or not draft.items:
            raise ConflictError("Chưa có bản nháp READY để phê duyệt.")
        plan = ApprovedPlanRecord(
            group_id=group_id, draft_id=draft.id, approved_by=actor.id, revision=1, status="active"
        )
        self.repository.add(plan)
        self.repository.flush()
        for item in draft.items:
            owner_id = item.approved_owner_id or item.proposed_owner_id
            self.repository.add(
                TaskProgressRecord(
                    plan_id=plan.id,
                    task_id=item.task_id,
                    owner_id=owner_id,
                    status="todo",
                    version=1,
                    updated_by=actor.id,
                )
            )
        draft.status = "approved"
        group.version += 1
        group.updated_by = actor.id
        payload = {"plan_id": str(plan.id), "draft_id": str(draft.id), "revision": 1}
        event = self.repository.create_event(
            event_type="plan.approved",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(group.id),
            version=group.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)

    def update_task(
        self,
        group_id: UUID,
        task_id: UUID,
        actor: UserRecord,
        *,
        status: str,
        blocked_reason: str | None,
        expected_version: int | None,
    ) -> tuple[dict, dict]:
        group = self.repository.get_group(group_id)
        if group is None:
            raise NotFoundError("Không tìm thấy nhóm.")
        self._require_group_member(group_id, actor)
        plan = self.repository.active_plan(group_id)
        if plan is None:
            raise ConflictError("Kế hoạch chưa được phê duyệt.")
        progress = self.repository.get_progress(plan.id, task_id)
        if progress is None:
            raise NotFoundError("Không tìm thấy task trong kế hoạch.")
        if actor.id not in {group.leader_id, progress.owner_id}:
            raise ForbiddenError("Chỉ owner hoặc nhóm trưởng được cập nhật task.")
        if expected_version is not None and progress.version != expected_version:
            raise ConflictError("Task đã được cập nhật ở phiên khác; hãy tải snapshot mới.")
        if status == "blocked" and not (blocked_reason or "").strip():
            raise DomainError("Task blocked cần có lý do.")
        progress.status = status
        progress.blocked_reason = (
            blocked_reason.strip() if status == "blocked" and blocked_reason else None
        )
        progress.version += 1
        progress.updated_by = actor.id
        group.version += 1
        group.updated_by = actor.id
        group.last_check_in_at = datetime.now(UTC)
        payload = {
            "id": str(task_id),
            "status": status,
            "blocked_reason": progress.blocked_reason,
            "version": progress.version,
        }
        event = self.repository.create_event(
            event_type="task.updated",
            scope_type="group",
            scope_id=str(group.id),
            entity_id=str(task_id),
            version=progress.version,
            actor=actor,
            payload=payload,
        )
        self.repository.commit()
        return payload, event_envelope(event)
