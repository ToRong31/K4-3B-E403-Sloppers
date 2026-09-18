from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import (
    get_assignment_draft_service,
    get_checklist_store,
    get_router_graph,
)
from src.infrastructure.checklist_store import ChecklistNotFoundError, ChecklistStore
from src.models.schemas import AssignmentDraftRequest, AssignmentDraftResponse
from src.services.assignment_drafts import AssignmentDraftService

router = APIRouter(prefix="/assignments", tags=["assignments"])
GraphDep = Annotated[Any, Depends(get_router_graph)]
ChecklistStoreDep = Annotated[ChecklistStore, Depends(get_checklist_store)]
AssignmentServiceDep = Annotated[
    AssignmentDraftService, Depends(get_assignment_draft_service)
]


def _tasks_from_checklist(checklist: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": task["id"],
            "title": task["title"],
            "deliverable": task["deliverable"],
            "description": task.get("description", ""),
            "required_skills": task.get("required_skills", []),
            "checkpoint_id": task.get("checkpoint_id"),
            "depends_on": task.get("depends_on", []),
            "estimated_effort": task.get("estimated_effort"),
        }
        for checkpoint in checklist.get("checkpoints", [])
        for task in checkpoint.get("tasks", [])
    ]


@router.post("/assign_tasks", response_model=AssignmentDraftResponse)
def assign_tasks(
    payload: AssignmentDraftRequest,
    graph: GraphDep,
    checklist_store: ChecklistStoreDep,
) -> AssignmentDraftResponse:
    request_data = payload.model_dump(mode="json")
    if payload.lab_id:
        try:
            checklist = checklist_store.load(payload.lab_id, payload.version)
        except ChecklistNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        request_data["tasks"] = _tasks_from_checklist(checklist)
    request_data.pop("lab_id", None)
    request_data.pop("version", None)
    result = graph.invoke(
        {"operation": "assign_tasks", "use_llm": True, **request_data}
    )
    return AssignmentDraftResponse.model_validate(result)


@router.post("/draft", response_model=AssignmentDraftResponse, deprecated=True)
def create_assignment_draft(
    payload: AssignmentDraftRequest,
    graph: GraphDep,
    checklist_store: ChecklistStoreDep,
    service: AssignmentServiceDep,
) -> AssignmentDraftResponse:
    """Keep legacy persistence for inline tasks and support canonical lab tasks."""
    if payload.lab_id:
        return assign_tasks(payload, graph, checklist_store)
    return service.create(payload)
