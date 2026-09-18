import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends

from src.api.deps import get_checklist_store, get_router_graph
from src.infrastructure.checklist_store import ChecklistStore
from src.infrastructure.json_store import get_json_store
from src.models.schemas import TaskAnalysisRequest, TaskAnalysisResponse

router = APIRouter(prefix="/labs", tags=["labs"])
RouterDep = Annotated[Any, Depends(get_router_graph)]
ChecklistStoreDep = Annotated[ChecklistStore, Depends(get_checklist_store)]
logger = logging.getLogger(__name__)


@router.get("")
def list_labs() -> list[dict[str, Any]]:
    return get_json_store().get_labs()


@router.post("/analyze", response_model=TaskAnalysisResponse)
def analyze_lab_endpoint(
    payload: TaskAnalysisRequest,
    graph: RouterDep,
    checklist_store: ChecklistStoreDep,
) -> TaskAnalysisResponse:
    """Analyze a LAB manifest or lab_id using the router graph."""
    state_payload: dict[str, Any] = {
        "operation": "analyze_lab",
        "use_llm": True,
        "mode": "full",
        "lab_version": payload.version,
    }
    if payload.lab_manifest:
        state_payload["lab_manifest"] = payload.lab_manifest
    if payload.lab_id:
        state_payload["lab_id"] = payload.lab_id
    if payload.documents:
        state_payload["documents"] = payload.documents

    result = graph.invoke(state_payload)
    checklist_draft = result.get("checklist_draft")
    if result.get("status") == "ready" and checklist_draft:
        if "lab_id" in checklist_draft and "lab_version" in checklist_draft:
            saved_path = checklist_store.save(checklist_draft)
            logger.info("Canonical checklist saved | path=%s", saved_path)
        else:
            logger.warning("Ready checklist was not persisted because metadata is missing")
    return TaskAnalysisResponse(
        status=result.get("status", "clarify"),
        checklist_draft=checklist_draft,
        checklist=checklist_draft,
        gaps=result.get("gaps", []),
        questions=result.get("questions", []),
        error=result.get("error"),
    )
