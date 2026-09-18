from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.infrastructure.json_store import get_json_store

router = APIRouter(prefix="/coach", tags=["coach"])


class SupportRequestCreate(BaseModel):
    groupId: str = "group-sloppers"
    groupName: str = "Sloppers"
    studentName: str
    taskTitle: str | None = None
    question: str


class SupportRequestResolve(BaseModel):
    response: str


@router.get("/groups")
def get_coach_groups() -> dict[str, Any]:
    store = get_json_store()
    return store.get_coach_overview()


@router.get("/support-requests")
def list_support_requests() -> list[dict[str, Any]]:
    store = get_json_store()
    return store.get_support_requests()


@router.post("/support-requests")
def create_support_request(payload: SupportRequestCreate) -> dict[str, Any]:
    store = get_json_store()
    return store.add_support_request(
        group_id=payload.groupId,
        group_name=payload.groupName,
        student_name=payload.studentName,
        question=payload.question,
        task_title=payload.taskTitle,
    )


@router.post("/support-requests/{request_id}/resolve")
def resolve_support_request(request_id: str, payload: SupportRequestResolve) -> dict[str, Any]:
    store = get_json_store()
    resolved = store.resolve_support_request(request_id, payload.response)
    if not resolved:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu hỗ trợ.")
    return resolved
