from typing import Annotated, Any

from fastapi import APIRouter, Depends

from src.api.deps import get_assignment_graph
from src.models.schemas import AssignmentDraftRequest, AssignmentDraftResponse

router = APIRouter(prefix="/assignments", tags=["assignments"])
GraphDep = Annotated[Any, Depends(get_assignment_graph)]


@router.post("/draft", response_model=AssignmentDraftResponse)
def create_assignment_draft(
    payload: AssignmentDraftRequest,
    graph: GraphDep,
) -> AssignmentDraftResponse:
    result = graph.invoke(payload.model_dump(mode="json"))
    return AssignmentDraftResponse.model_validate(result)
