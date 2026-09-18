from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.deps import CurrentUser, get_assignment_graph, get_workspace_repository
from src.infrastructure.database.models import ApprovedPlanRecord
from src.infrastructure.database.repositories import WorkspaceRepository
from src.infrastructure.json_store import get_json_store
from src.services.assignment_workflow import AssignmentWorkflowService
from src.services.realtime import realtime_hub
from src.services.workspace import DomainError, WorkspaceService

router = APIRouter(tags=["workspace"])
WorkspaceRepo = Annotated[WorkspaceRepository, Depends(get_workspace_repository)]
AssignmentGraph = Annotated[Any, Depends(get_assignment_graph)]


class GroupCreatePayload(BaseModel):
    lab_id: str
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=4, max_length=20)
    invitee_codes: list[str] = Field(default_factory=list, max_length=3)


class GroupUpdatePayload(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    code: str | None = Field(default=None, min_length=4, max_length=20)


class InvitationPayload(BaseModel):
    student_codes: list[str] = Field(min_length=1, max_length=3)


class SkillItem(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    level: int = Field(ge=1, le=5)


class SkillProfilePayload(BaseModel):
    industry: str | None = Field(default=None, max_length=100)
    skills: list[SkillItem] = Field(min_length=1, max_length=10)


class AssignmentOverridePayload(BaseModel):
    owner_id: UUID


class TaskUpdatePayload(BaseModel):
    status: Literal["todo", "doing", "blocked", "done"]
    blocked_reason: str | None = Field(default=None, max_length=1000)
    expected_version: int | None = Field(default=None, ge=1)


def service(repo: WorkspaceRepository) -> WorkspaceService:
    return WorkspaceService(repo)


def raise_domain(error: DomainError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("/groups/current")
def get_current_group_workspace(actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    try:
        return service(repo).snapshot(actor)
    except DomainError as error:
        raise_domain(error)


@router.get("/users/directory")
def get_class_directory(actor: CurrentUser, repo: WorkspaceRepo) -> list[dict]:
    if actor.role != "leader":
        raise HTTPException(status_code=403, detail="Chỉ nhóm trưởng được xem danh sách mời.")
    colors = ["#ef4444", "#0ea5e9", "#8b5cf6", "#16a34a"]
    return [
        {
            "id": str(user.id),
            "studentCode": user.student_code,
            "fullName": user.display_name,
            "name": user.short_name,
            "className": actor.class_scope_id,
            "avatar": user.short_name[:1].upper(),
            "color": colors[index % len(colors)],
        }
        for index, user in enumerate(repo.list_class_members(actor.class_scope_id))
    ]


@router.get("/groups/{group_id}/snapshot")
def get_group_snapshot(group_id: UUID, actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    try:
        return service(repo).snapshot(actor, group_id)
    except DomainError as error:
        raise_domain(error)


@router.post("/groups", status_code=201)
async def create_group(
    payload: GroupCreatePayload, actor: CurrentUser, repo: WorkspaceRepo
) -> dict:
    try:
        result, events = service(repo).create_group(
            actor,
            lab_slug=payload.lab_id,
            name=payload.name,
            code=payload.code,
            invitee_codes=payload.invitee_codes,
        )
        for event in events:
            await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.patch("/groups/{group_id}")
async def update_group(
    group_id: UUID,
    payload: GroupUpdatePayload,
    actor: CurrentUser,
    repo: WorkspaceRepo,
) -> dict:
    try:
        result, event = service(repo).update_group(
            group_id, actor, name=payload.name, code=payload.code
        )
        if event:
            await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.delete("/groups/{group_id}", status_code=204)
async def delete_group(group_id: UUID, actor: CurrentUser, repo: WorkspaceRepo) -> None:
    try:
        event = service(repo).delete_group(group_id, actor)
        await realtime_hub.broadcast(event)
    except DomainError as error:
        raise_domain(error)


@router.post("/groups/{group_id}/invitations", status_code=201)
async def invite_members(
    group_id: UUID, payload: InvitationPayload, actor: CurrentUser, repo: WorkspaceRepo
) -> list[dict]:
    try:
        result, event = service(repo).invite(group_id, actor, payload.student_codes)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


async def invitation_response(
    invitation_id: UUID, decision: str, actor: CurrentUser, repo: WorkspaceRepository
) -> dict:
    try:
        result, event = service(repo).respond_invitation(invitation_id, actor, decision)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.post("/invitations/{invitation_id}/accept")
async def accept_invitation(invitation_id: UUID, actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    return await invitation_response(invitation_id, "accepted", actor, repo)


@router.post("/invitations/{invitation_id}/decline")
async def decline_invitation(invitation_id: UUID, actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    return await invitation_response(invitation_id, "declined", actor, repo)


@router.delete("/groups/{group_id}/members/me", status_code=204)
async def leave_group(group_id: UUID, actor: CurrentUser, repo: WorkspaceRepo) -> None:
    try:
        _, event = service(repo).remove_member(group_id, actor.id, actor)
        await realtime_hub.broadcast(event)
    except DomainError as error:
        raise_domain(error)


@router.delete("/groups/{group_id}/members/{user_id}", status_code=204)
async def remove_group_member(
    group_id: UUID, user_id: UUID, actor: CurrentUser, repo: WorkspaceRepo
) -> None:
    try:
        _, event = service(repo).remove_member(group_id, user_id, actor)
        await realtime_hub.broadcast(event)
    except DomainError as error:
        raise_domain(error)


@router.put("/groups/{group_id}/members/me/skill-profile")
async def save_skill_profile(
    group_id: UUID, payload: SkillProfilePayload, actor: CurrentUser, repo: WorkspaceRepo
) -> dict:
    try:
        result, event = service(repo).save_profile(
            group_id,
            actor,
            industry=payload.industry,
            skills=[item.model_dump() for item in payload.skills],
        )
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.post("/groups/{group_id}/assignment-drafts", status_code=201)
async def create_assignment_draft(
    group_id: UUID, actor: CurrentUser, repo: WorkspaceRepo, graph: AssignmentGraph
) -> dict:
    try:
        result, event = AssignmentWorkflowService(repo, graph).create(group_id, actor)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.patch("/assignment-drafts/{draft_id}/items/{task_id}")
async def override_assignment(
    draft_id: UUID,
    task_id: UUID,
    payload: AssignmentOverridePayload,
    actor: CurrentUser,
    repo: WorkspaceRepo,
) -> dict:
    try:
        result, event = AssignmentWorkflowService(repo, None).override(
            draft_id, task_id, payload.owner_id, actor
        )
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.post("/assignment-drafts/{draft_id}/approve")
async def approve_draft(draft_id: UUID, actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    try:
        draft = repo.get_draft(draft_id)
        if draft is None or draft.group_id is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy bản nháp.")
        latest = repo.latest_draft(draft.group_id)
        if latest is None or latest.id != draft.id:
            raise HTTPException(
                status_code=409,
                detail="Bản nháp này không còn là phiên bản mới nhất của nhóm.",
            )
        result, event = service(repo).approve_latest_plan(draft.group_id, actor)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.post("/groups/current/plan/approve")
async def approve_current_plan(actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    try:
        group = service(repo).current_group(actor)
        result, event = service(repo).approve_latest_plan(group.id, actor)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.patch("/plans/{plan_id}/tasks/{task_id}")
async def update_plan_task(
    plan_id: UUID,
    task_id: UUID,
    payload: TaskUpdatePayload,
    actor: CurrentUser,
    repo: WorkspaceRepo,
) -> dict:
    try:
        plan = repo.session.get(ApprovedPlanRecord, plan_id)
        if plan is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy kế hoạch.")
        result, event = service(repo).update_task(
            plan.group_id,
            task_id,
            actor,
            status=payload.status,
            blocked_reason=payload.blocked_reason,
            expected_version=payload.expected_version,
        )
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


@router.patch("/groups/current/tasks/{task_id}")
async def update_current_group_task(
    task_id: UUID, payload: TaskUpdatePayload, actor: CurrentUser, repo: WorkspaceRepo
) -> dict:
    try:
        group = service(repo).current_group(actor)
        result, event = service(repo).update_task(
            group.id,
            task_id,
            actor,
            status=payload.status,
            blocked_reason=payload.blocked_reason,
            expected_version=payload.expected_version,
        )
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        raise_domain(error)


class FileUploadPayload(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(default="application/octet-stream", max_length=100)
    file_url: str
    size_bytes: int = Field(default=0, ge=0)
    group_id: str | None = None
    channel: str = Field(default="group", max_length=20)
    is_image: bool = False


@router.get("/groups/current/chat")
def get_current_group_chat(repo: WorkspaceRepo) -> list[dict[str, Any]]:
    db_messages = repo.list_group_chat_messages("group-sloppers")
    if db_messages:
        return db_messages
    return get_json_store().get_group_chat_messages()


@router.post("/groups/current/chat")
async def send_current_group_chat(
    payload: dict[str, Any], repo: WorkspaceRepo
) -> dict[str, Any]:
    # Persist to database
    saved_record = repo.save_group_chat_message(payload)
    # Sync with json store for backward-compatibility
    get_json_store().add_group_chat_message(payload)

    # Realtime websocket broadcast to active group members
    group_id = str(payload.get("groupId") or "group-sloppers")
    await realtime_hub.broadcast({
        "event_id": f"chat:{saved_record.id}",
        "type": "chat.message_sent",
        "scope_id": group_id,
        "entity_id": str(saved_record.id),
        "version": 1,
        "occurred_at": datetime.now(UTC).isoformat(),
        "actor": {
            "id": str(payload.get("senderId") or "system"),
            "role": str(payload.get("role") or "member"),
        },
        "payload": payload,
    })
    return payload


@router.post("/files/upload")
def upload_file_to_db(payload: FileUploadPayload, repo: WorkspaceRepo) -> dict[str, Any]:
    record = repo.save_file_attachment(
        filename=payload.filename,
        content_type=payload.content_type,
        file_url=payload.file_url,
        size_bytes=payload.size_bytes,
        group_id=payload.group_id or "group-sloppers",
        channel=payload.channel,
        is_image=payload.is_image,
    )
    return {
        "id": str(record.id),
        "filename": record.filename,
        "content_type": record.content_type,
        "size_bytes": record.size_bytes,
        "file_url": record.file_url,
        "channel": record.channel,
        "is_image": record.is_image,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@router.get("/groups/current/files")
def list_current_group_files(repo: WorkspaceRepo) -> list[dict[str, Any]]:
    attachments = repo.list_file_attachments(group_id="group-sloppers")
    return [
        {
            "id": str(att.id),
            "filename": att.filename,
            "content_type": att.content_type,
            "size_bytes": att.size_bytes,
            "file_url": att.file_url,
            "channel": att.channel,
            "is_image": att.is_image,
            "created_at": att.created_at.isoformat() if att.created_at else None,
        }
        for att in attachments
    ]

