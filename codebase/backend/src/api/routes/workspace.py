from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.infrastructure.json_store import get_json_store

router = APIRouter(prefix="/groups", tags=["workspace"])


class TaskUpdatePayload(BaseModel):
    status: str | None = None
    owner: str | None = None


@router.get("/current")
def get_current_group_workspace() -> dict[str, Any]:
    store = get_json_store()
    return store.get_workspace()


@router.patch("/current/tasks/{task_id}")
def update_group_task(task_id: str, payload: TaskUpdatePayload) -> dict[str, Any]:
    store = get_json_store()
    updates = payload.model_dump(exclude_none=True)
    task = store.update_task(task_id, updates)
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy task.")
    return task


@router.post("/current/plan/approve")
def approve_group_plan() -> dict[str, Any]:
    store = get_json_store()
    return store.approve_plan()
