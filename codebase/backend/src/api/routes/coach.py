from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.deps import CurrentUser, get_workspace_repository
from src.infrastructure.database.repositories import WorkspaceRepository
from src.services.coach import CoachService
from src.services.realtime import realtime_hub
from src.services.workspace import DomainError

router = APIRouter(prefix="/coach", tags=["coach"])
WorkspaceRepo = Annotated[WorkspaceRepository, Depends(get_workspace_repository)]


class SupportRequestCreate(BaseModel):
    group_id: UUID | None = Field(default=None, alias="groupId")
    topic: str = Field(default="Hỗ trợ chung bài Lab", max_length=200)
    question: str = Field(min_length=1, max_length=4000)
    urgent: bool = False


class SupportReply(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class LegacyResolve(BaseModel):
    response: str | None = Field(default=None, max_length=4000)


def fail(error: DomainError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("/groups")
def get_coach_groups(actor: CurrentUser, repo: WorkspaceRepo) -> dict:
    try:
        return CoachService(repo).dashboard(actor)
    except DomainError as error:
        fail(error)


@router.get("/support-requests")
def list_support_requests(actor: CurrentUser, repo: WorkspaceRepo) -> list[dict]:
    try:
        return CoachService(repo).list_requests(actor)
    except DomainError as error:
        fail(error)


@router.post("/support-requests", status_code=201)
async def create_support_request(
    payload: SupportRequestCreate, actor: CurrentUser, repo: WorkspaceRepo
) -> dict:
    try:
        group = repo.get_group_for_user(actor.id)
        group_id = payload.group_id or (group.id if group else None)
        if group_id is None:
            raise HTTPException(status_code=404, detail="Tài khoản chưa có nhóm.")
        result, event = CoachService(repo).create_request(
            actor,
            group_id=group_id,
            topic=payload.topic,
            question=payload.question,
            urgent=payload.urgent,
        )
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        fail(error)


@router.post("/support-requests/{request_id}/replies", status_code=201)
async def reply_support_request(
    request_id: UUID, payload: SupportReply, actor: CurrentUser, repo: WorkspaceRepo
) -> dict:
    try:
        result, event = CoachService(repo).reply(actor, request_id, payload.message)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        fail(error)


@router.post("/support-requests/{request_id}/resolve")
async def resolve_support_request(
    request_id: UUID, payload: LegacyResolve, actor: CurrentUser, repo: WorkspaceRepo
) -> dict:
    try:
        coach = CoachService(repo)
        if payload.response:
            _, reply_event = coach.reply(actor, request_id, payload.response)
            await realtime_hub.broadcast(reply_event)
        result, event = coach.resolve(actor, request_id)
        await realtime_hub.broadcast(event)
        return result
    except DomainError as error:
        fail(error)
