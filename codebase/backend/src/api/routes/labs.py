from typing import Annotated, Any

from fastapi import APIRouter, Depends

from src.api.deps import get_router_graph
from src.models.schemas import TaskAnalysisRequest, TaskAnalysisResponse

router = APIRouter(prefix="/labs", tags=["labs"])
RouterDep = Annotated[Any, Depends(get_router_graph)]


@router.post("/analyze", response_model=TaskAnalysisResponse)
def analyze_lab_endpoint(
    payload: TaskAnalysisRequest,
    graph: RouterDep,
) -> TaskAnalysisResponse:
    """Analyze a LAB manifest or lab_id using the router graph."""
    state_payload: dict[str, Any] = {
        "operation": "analyze_lab",
    }
    if payload.lab_manifest:
        state_payload["lab_manifest"] = payload.lab_manifest
    if payload.lab_id:
        state_payload["lab_id"] = payload.lab_id

    result = graph.invoke(state_payload)
    return TaskAnalysisResponse(
        status=result.get("status", "clarify"),
        checklist_draft=result.get("checklist_draft"),
        gaps=result.get("gaps", []),
        questions=result.get("questions", []),
    )
